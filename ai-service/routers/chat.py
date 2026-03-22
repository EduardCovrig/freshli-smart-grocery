import os
import json
from fastapi import APIRouter
from pydantic import BaseModel
from groq import Groq
from database import get_db_connection

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


@router.post("/chat")
def ai_chat_assistant(request: ChatRequest):
    conn = get_db_connection()
    cursor = conn.cursor()

   # toate datele de care poate sa aibe nevoie ai-ul, in caz de utilizatorul are cereri speciale gen brand/pret.
    cursor.execute("""
        SELECT p.id, p.name, p.price, b.name 
        FROM product p 
        JOIN brand b ON p.brand_id = b.id 
        WHERE p.stock_quantity > 0
    """)
    products = cursor.fetchall()
    conn.close()

    # Format "ID: 282] Piept de Pui (BrandName) - 14.5 LEI
    produse_text = ", ".join([f"[ID: {p[0]}] {p[1]} ({p[3]}) - {p[2]} LEI" for p in products])

    #Prompt-ul initial
    system_prompt = f"""You are Freshli, a friendly and helpful culinary and grocery assistant.
    The user will ask for recipes, meal recommendations, or specific products.
    Our available inventory is: {produse_text}.

    CRITICAL INSTRUCTIONS:
    1. You MUST respond in the EXACT SAME LANGUAGE the user writes in.
    2. If the user writes in Romanian, you MUST use correct Romanian diacritics (ă, â, î, ș, ț).
    3. You must recommend ONLY products from the provided inventory list. Do not invent products.
    4. Pay attention to user preferences like "cheaper", "specific brand", or "budget", using the price and brand info.

    You MUST respond ONLY with a valid JSON object, and nothing else.
    The JSON structure must be exactly this:
    {{
        "mesaj": "Your friendly response, recipe, or advice here.",
        "produse_recomandate": [id1, id2, id3]
    }}
    """

    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    chat_completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": request.message}
        ],
        model="llama-3.1-8b-instant",
        response_format={"type": "json_object"}
    )

    return json.loads(chat_completion.choices[0].message.content)