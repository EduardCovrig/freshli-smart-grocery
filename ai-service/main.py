import os
import pandas as pd
from fastapi import FastAPI
from sklearn.metrics.pairwise import cosine_similarity
import psycopg2
import warnings
from dotenv import load_dotenv
import joblib #importa fisierul .pkl pt churn
from fastapi.middleware.cors import CORSMiddleware #cors

load_dotenv() #incarca variabilele (baza de date) din .env
warnings.filterwarnings('ignore')


app=FastAPI(title="Machine Learning Licenta Covrig Eduard", description="Machine Learning API: Recommendations & Churn Prediction" )
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_CONFIG={
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password":os.getenv("DB_PASSWORD"),
    "host":os.getenv("DB_HOST"),
    "port":os.getenv("DB_PORT")
}

try:
    churn_model = joblib.load('churn_model.pkl')
    print("Modelul de Churn Prediction (.pkl) a fost incarcat cu succes.")
except Exception as e:
    churn_model = None
    print(f"⚠Eroare la incarcarea modelului de churn: {e}")


# ALGORITMUL DE RECOMANDARI (MEMORY-BASED)
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

@app.get("/api/ai/recommend/{user_id}")
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

#ALGORITMUL DE CHURN PREDICTION RANDOM FOREST PENTRU ADMIN DASHBOARD

@app.get("/api/ai/churn")
def prezice_abandon_clienti():
    #Ruta accesata de AdminDashboard pentru a vedea riscul de abandon al clientilor.
    if churn_model is None:
        return {
            "status": "error",
            "message": "Modelul RFM nu este incarcat."
        }
    # 1. Extragem situatia la zi din baza de date
    conn = psycopg2.connect(**DB_CONFIG)
    query_users = "SELECT id, email, first_name, last_name, created_at FROM users WHERE role='USER'"
    df_users = pd.read_sql(query_users, conn)

    query_orders = "SELECT user_id, created_at, total_price FROM orders WHERE status != 'CANCELLED'" #date despre comenzile
    #care nu au fost anulate
    df_orders = pd.read_sql(query_orders, conn)
    conn.close() #inchidem conexiunea

    if df_users.empty:
        return {
            "status": "success",
            "data": [] #date goale, dar succes
        }

    now = pd.to_datetime('now', utc=True)
    df_users['created_at'] = pd.to_datetime(df_users['created_at'], utc=True)
    if not df_orders.empty:
        df_orders['created_at'] = pd.to_datetime(df_orders['created_at'], utc=True)

    rezultate_finale = []

    # 2. Calculam metricile pentru fiecare client si il trecem prin modelul AI
    for _, user in df_users.iterrows():
        uid = user['id']
        if not df_orders.empty:
            user_orders = df_orders[df_orders['user_id'] == uid]
        else:
            user_orders = pd.DataFrame()

        account_age = (now - user['created_at']).days

        if len(user_orders) > 0:
            tot_orders = len(user_orders)
            tot_spent = user_orders['total_price'].sum()
            last_order_date = user_orders['created_at'].max()
            recency = (now - last_order_date).days
        else:
            tot_orders = 0
            tot_spent = 0.0
            recency = account_age

        # Asiguram valori minime de 1 zi.
        account_age_days = max(account_age, 1)
        recency_days = max(recency, 1)
        aov = tot_spent / tot_orders if tot_orders > 0 else 0 #evitam impartirea la 0

        # Construim exact structura pe care a invatat-o modelul
        features = pd.DataFrame([{
            'account_age_days': account_age_days,
            'total_orders': tot_orders,
            'total_spent': tot_spent,
            'recency_days': recency_days,
            'aov': aov
        }])

        # predict_proba returneaza un array de probabilitati:
        # [[Sansa sa fie Activ, Sansa sa fie Pierdut]] -> ex: [[0.15, 0.85]]
        probabilitati = churn_model.predict_proba(features)[0]
        sansa_abandon = probabilitati[1]  # Extragem a doua valoare (index 1)

        rezultate_finale.append({
            "userId": uid,
            "email": user['email'],
            "name": f"{user['first_name']} {user['last_name']}",
            "churnRisk": round(sansa_abandon * 100, 1),
            "totalOrders": tot_orders,
            "totalSpent": round(tot_spent, 2),
            "daysSinceLastOrder": recency_days
        })

    # Sortam array-ul descrescator (Adminul sa ii vada pe primii cei mai "riscanti")
    rezultate_finale.sort(key=lambda x: x['churnRisk'], reverse=True)

    return {
        "status": "success",
        "tip_algoritm": "Random Forest - RFM",
        "data": rezultate_finale
    }