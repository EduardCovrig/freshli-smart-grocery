import pandas as pd
import psycopg2
import warnings
from sklearn.metrics.pairwise import cosine_similarity
from fastapi import APIRouter
from database import DB_CONFIG

#ascunde warningurile legate de baza de date si pandas
warnings.filterwarnings('ignore', message='^pandas only supports SQLAlchemy.*')

router = APIRouter()

def get_recommendations(target_user_id: int, numar_recomandari: int=5): #default 5
    # 1. Extragem datele din baza de date
    conn=psycopg2.connect(**DB_CONFIG)
    query = "SELECT user_id, product_id, interaction_type FROM user_interaction"
    df = pd.read_sql(query, conn)
    query_cart = f""""
            SELECT ci.product_id 
            FROM cart_item ci 
            JOIN cart c ON ci.cart_id = c.id 
            WHERE c.user_id = {target_user_id}
        """
    try:
        df_cart = pd.read_sql(query_cart, conn)
        produse_in_cos = set(df_cart['product_id'])
    except Exception:
        produse_in_cos = set() #daca apare o eroare, facem un set gol.

    conn.close() #inchidem conexiunea cu baza de date momentan
    if df.empty: #daca nu avem date in user_interaction, nu returnam nicio recomandare
        return []

    # 2. PONDERILE ACTIUNILOR
    puncte={
        "VIEW":1,
        "ADD_TO_CART":2,
        "PURCHASE":3
    }
    df["scor"]=df["interaction_type"].map(puncte)
    df_grupat=df.groupby(["user_id","product_id"])["scor"].sum().reset_index()
    #grupam toate actiunile pe care un user le face asupra unui produs si le adunam
    # ex daca userul se uita la un produs si il adauga in cos si il si cumpara are scor 1+2+3=6

    #3. Construim matricea si tratam cazul utilizatorului nou
    matrice=df_grupat.pivot(index="user_id",columns="product_id",values="scor").fillna(0)
    #CAZUL UTILIZATORULUI NOU (NU EXISTA IN MATRICE acel userId)
    if(target_user_id not in matrice.index):
        top_populare=df_grupat.groupby('product_id')['scor'].sum().sort_values(ascending=False)
        return top_populare.head(numar_recomandari).index.tolist() #returnam {numar_recomandari} produsele cu cel mai mare scor
        #din toata matricea, de la toti userii adunati (suma pe coloane)

    #4. Calculam cat de mult seamana userii intre ei
    similaritati=cosine_similarity(matrice)
    df_similaritati=pd.DataFrame(similaritati,index=matrice.index,columns=matrice.index)
    scoruri_asemanare= df_similaritati[target_user_id].sort_values(ascending=False)[1:]
    #Ignoram prima valoare, deoarece acea valoare este chiar userul comparat cu el, deci va fi 100% asemanarea.

    # DEMO PRINT PENTRU PREZENTARE
    print("\n" + "=" * 50)
    print(f"AI COLLABORATIVE FILTERING - ANALIZA USER #{target_user_id}")
    print("=" * 50)
    print(f"Top 3 utilizatori similari gasiti in baza de date:")

    count_print = 0
    for uid, scor in scoruri_asemanare.items():
        if scor > 0 and count_print < 3:
            print(f" User #{uid} -> Asemanare: {scor * 100:.2f}%")
            count_print += 1
    if count_print == 0:
        print(" Niciun utilizator cu profil similar gasit. Se vor folosi cele mai populare produse.")
    print("-" * 50)
    # ---------------------------------

    recomandari={} #definim dictionarul de recomandari
    for user_geaman, grad_asemanare in scoruri_asemanare.items():
        if grad_asemanare <= 0:
            break  # Daca nu seamana deloc, ne oprim
        produse_geaman = df_grupat[df_grupat['user_id'] == user_geaman] #lista produse care ii plac la geaman
        for _, rand in produse_geaman.iterrows():
            prod_id = int(rand['product_id']) #int ca sa nu fie cumva id-ul cu virgula
            if prod_id not in produse_in_cos:  #Daca e un produs NOU pentru user
                if prod_id not in recomandari:
                    recomandari[prod_id] = 0
                recomandari[prod_id] += rand['scor'] * grad_asemanare
                #ii calculam scorul produsului ca  scorul geamanului * gradul de asemanare intre cei doi useri.
    #sortam rezultatele ca sa le luam pe cele mai bune
    rezultat_sortat = sorted(recomandari.items(), key=lambda x: x[1], reverse=True) #recomandari.items face o lista de tupluri
    #(key,value), iar lambda-ul face ca noi sa sortam dupa value, nu dupa key. x[1]=value.
    top_ids = [prod_id for prod_id, scor in rezultat_sortat[:numar_recomandari]]

    # DEMO PRINT PENTRU PREZENTARE
    if len(top_ids) > 0:
        print(f"Primele 8 produse castigatoare recomandate pe baza similaritatii:")
        for idx, (p_id, scor) in enumerate(rezultat_sortat[:8]):
            print(f"   {idx + 1}. Produs #{p_id} (Scor de predictie: {scor:.2f})")
    # ---------------------------------

    #6. fallback (ai-ul nu a gasit destule produse noi  ca sa indeplineasca numar_recomandari dat ca parametru)
    #umplem restul produselor cu cele mai populare dintre toti userii
    if len(top_ids) < numar_recomandari:
        populare = df_grupat.groupby('product_id')['scor'].sum().sort_values(ascending=False).index.tolist()
        for p_id in populare:
            if p_id not in produse_in_cos and p_id not in top_ids:
                top_ids.append(int(p_id)) #int ca sa nu fie cumva id-ul cu virgula in output
            if len(top_ids) == numar_recomandari:
                break
    return top_ids

@router.get("/recommend/{user_id}")
def ia_recomandari_ai(user_id: int):
    # Daca primim id-ul 0 (user-ul nu e logat)
    if user_id == 0:
        # ii fortam apelarea cu un id mare, care sigur nu e folosit, ca sa il fortam sa intre pe varianta cazului utilizatorului nou
        id_uri_recomandate = get_recommendations(9999999,100)
    else:
        id_uri_recomandate = get_recommendations(user_id,100)
    return {
        "status": "success",
        "tip_algoritm": "Collaborative Filtering",
        "user_tinta": user_id,
        "recommended_ids": id_uri_recomandate
    }