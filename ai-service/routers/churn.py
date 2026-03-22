import pandas as pd
import psycopg2
import joblib
from fastapi import APIRouter
from database import DB_CONFIG

router = APIRouter()

try:
    churn_model = joblib.load('churn_model.pkl')
    print("Modelul de Churn Prediction (.pkl) a fost incarcat cu succes.")
except Exception as e:
    churn_model = None
    print(f"⚠Eroare la incarcarea modelului de churn: {e}")

#ALGORITMUL DE CHURN PREDICTION RANDOM FOREST PENTRU ADMIN DASHBOARD

@router.get("/churn")
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