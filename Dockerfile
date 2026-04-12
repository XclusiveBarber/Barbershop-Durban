FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["BarberShopBookingSystem/BarberShopBookingSystem.csproj", "BarberShopBookingSystem/"]
RUN dotnet restore "BarberShopBookingSystem/BarberShopBookingSystem.csproj"
COPY . .
WORKDIR "/src/BarberShopBookingSystem"
RUN dotnet build "BarberShopBookingSystem.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "BarberShopBookingSystem.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000
ENTRYPOINT ["dotnet", "BarberShopBookingSystem.dll"]
