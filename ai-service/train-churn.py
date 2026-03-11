import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import warnings
import psycopg2
from dotenv import load_dotenv

#ALGORITM RANDOM FOREST PENTRU A DETERMINA SANSA DE PIERDERE A CLIENTILOR




load_dotenv() #incarca variabilele pentru baza de date din .env
warnings.filterwarnings('ignore')

print("Incepere Antrenare Model de Churn Prediction (RFM)")

# 1. EXTRAGEREA SI PROCESAREA DATELOR REALE DIN POSTGRESQL
DB_CONFIG = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT")
}

real_data = []

try:
    conn = psycopg2.connect(**DB_CONFIG)
    #Luam toti userii cu rol de 'USER'
    query_users = "SELECT id, created_at FROM users WHERE role='USER'"
    df_users = pd.read_sql(query_users, conn)

    #Luam date despre toate comenzile plasate si care nu au fost anulate
    query_orders = "SELECT user_id, created_at, total_price FROM orders WHERE status != 'CANCELLED'"
    df_orders = pd.read_sql(query_orders, conn)

    conn.close() #inchidem conexiunea cu baza de date

    #Standardizam timpii in UTC pt a putea face calcule ulterior
    now = pd.to_datetime('now', utc=True)
    df_users['created_at'] = pd.to_datetime(df_users['created_at'], utc=True)
    df_orders['created_at'] = pd.to_datetime(df_orders['created_at'], utc=True)

    #Calculam atributele RFM pentru FIECARE user real
    for _, user in df_users.iterrows():
        uid = user['id']
        user_orders = df_orders[df_orders['user_id'] == uid]

        # zilele de cand are contul
        account_age = (now - user['created_at']).days

        if len(user_orders) > 0:
            tot_orders = len(user_orders)
            tot_spent = user_orders['total_price'].sum()
            last_order_date = user_orders['created_at'].max()
            recency = (now - last_order_date).days #ultima comanda, zile
        else:
            # Daca a facut contul dar nu a dat comenzi deloc
            tot_orders = 0
            tot_spent = 0.0
            recency = account_age

        real_data.append({
            'account_age_days': max(account_age, 1),  #Evitam valoarea 0 pt conturi create azi
            'total_orders': tot_orders,
            'total_spent': tot_spent,
            'recency_days': max(recency, 1) #Evitam valoarea 0 pt conturi create azi
        })

    df_real = pd.DataFrame(real_data)
    #Calculam AOV, dar evitam impartirea la 0 pentru cei fara comenzi
    # AOV = Average Order Value
    df_real['aov'] = np.where(df_real['total_orders'] > 0, df_real['total_spent'] / df_real['total_orders'], 0)
    #prima varianta, sau 0 daca df_real['total_orders] < 0

    print(f"-> S-au extras si procesat {len(df_real)} utilizatori reali.")
except Exception as e:
    print(f"Eroare la baza de date: {e}. Vom continua doar cu date sintetice.")
    df_real = pd.DataFrame()

# 2. GENERARE DATE SINTETICE (Data Augmentation)
print("Generare 1000 de profile sintetice pentru Data Augmentation...")
np.random.seed(42) #seed ca datele sa fie consitente la fiecare rulare
num_samples = 1000

data = {
    'account_age_days': np.random.randint(10, 366, num_samples), # [10,366)
    'total_orders': np.random.randint(0, 50, num_samples), #[0,50)
    'total_spent': np.random.uniform(50.0, 5000.0, num_samples) # [50,5000)
}
df_synth = pd.DataFrame(data)
#print(df_synth) #testing

#Corectam logica pentru cei generati cu 0 comenzi
df_synth.loc[df_synth['total_orders'] == 0, 'total_spent'] = 0.0
df_synth['recency_days'] = df_synth.apply(
    lambda row: row['account_age_days'] if row['total_orders'] == 0 else np.random.randint(1, int(row['account_age_days']) + 1),
    axis=1
)
df_synth['aov'] = np.where(df_synth['total_orders'] > 0, df_synth['total_spent'] / df_synth['total_orders'], 0.0)
#aov = average order value



# 3. COMBINAREA DATELOR SI ADAUGAREA ETICHETELOR (LABELING)
# Lipim cele doua tabele
df = pd.concat([df_real, df_synth], ignore_index=True) if not df_real.empty else df_synth

# Definim regula probabilistica pe care AI-ul trebuie sa o gandeasca si sa o invete
#PIERDUT=1
#ACTIV=0
def generate_churn_label(row):
    #Setam o probabilitate de baza liniara: cate zile au trecut, atata % risc are initial
    #Ex: a trecut o luna (30 zile) = 30% risc de baza. Au trecut 50 zile = 50% risc.
    prob = row['recency_days'] / 100.0

    # Ajustam in functie de activitate
    if row['total_orders'] == 0:
        if row['account_age_days'] > 30:
            prob = 0.85  # Cont vechi fara nicio comanda -> Risc mare
        else:
            prob = 0.15  # Cont nou creat -> Risc mic
    else:
        # Daca e client fidel (5+ comenzi), ii scadem riscul cu 20%
        if row['total_orders'] >= 5:
            prob -= 0.20
        # Daca a dat doar 1-2 comenzi, riscul creste usor cu 15%
        elif row['total_orders'] < 3:
            prob += 0.15

    #Probabilitatea trb sa ramana mereu intre 5% si 95%
    prob = max(0.05, min(0.95, prob))

    # Alegem 1 (Pierdut) sau 0 (Activ) folosind variabila prob
    return np.random.choice([1, 0], p=[prob, 1 - prob])

df['churn_label'] = df.apply(generate_churn_label, axis=1)

print(f"-> Date totale (Reale + Sintetice) gata de antrenament: {len(df)} inregistrari.")

# 4. ANTRENAMENTUL SI TESTAREA MODELULUI
X = df[['account_age_days', 'total_orders', 'total_spent', 'recency_days', 'aov']]
y = df['churn_label']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
#random_state=42 ca datele sa fie consecvente la fiecare rulare.
#80% pentru antrenare (X_train, y_train) si 20% pentru testul final (X_test, y_test)

print("\nAntrenare model Random Forest Classifier...")
model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
#n_estimators=100 -> 100 de arbori de decizie.
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"\nAcuratete Model: {accuracy * 100:.2f}%\n")
print("Raport de Clasificare (Precizie, Recall):")
#0 -> Client activ
#1 -> Client pierdut (Churned)
#precision -> % cu care un utilizator a fost marcat corect ca 0 sau 1
#recall -> ex: cat % din clientii care parasesc platforma, i-a gasit algoritmul.
#f1-score -> media dintre precision si recall. (nota algoritmului)
# support -> nr de clienti testati
print(classification_report(y_test, y_pred))

# 5. SALVAREA MODELULUI IN FISIER
model_filename = 'churn_model.pkl'
joblib.dump(model, model_filename)
print(f"=== Modelul a fost antrenat si salvat cu succes in '{model_filename}'! ===")