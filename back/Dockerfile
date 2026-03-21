# Compilarea codului (construim fisierul .jar)
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Copiem fisierele de configurare Maven
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Dam permisiune de executie scriptului Maven
RUN chmod +x mvnw

# Copiem codul sursa
COPY src src

# Compilam aplicatia ignorand testele ca sa se miste repede
RUN ./mvnw clean package -DskipTests

# Rularea aplicatiei
FROM eclipse-temurin:21-jre
WORKDIR /app

# Luam fisierul .jar gata compilat din prima etapa
COPY --from=build /app/target/*.jar app.jar

# Expunem portul 8080
EXPOSE 8080

# Comanda de start
ENTRYPOINT ["java", "-jar", "app.jar"]