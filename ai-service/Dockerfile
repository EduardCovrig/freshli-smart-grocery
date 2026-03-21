# 1.  Linux cu Python 3.11 instalat
FROM python:3.11-slim
# 2. Ne mutam in folderul /app din interiorul cutiei Docker
WORKDIR /app
# 3. Copiem fisierul de cerinte si instalam librariile
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# 4. Copiem tot restul codului python
COPY . .
# 5. Expunem portul fastapi
EXPOSE 8000
# 6. Comanda care porneste serverul
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]