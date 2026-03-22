import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv() #preia datele din .env

#initializare ai
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

print("Trimit cererea catre Groq...")

#test cerere
chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Vreau sa imi faci o gluma despre atletico madrid si de cholo simeone.",
        }
    ],
    model="llama-3.1-8b-instant",
)

#afisare raspuns groq
print("\nRaspuns Groq:")
print(chat_completion.choices[0].message.content)