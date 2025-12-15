# =========================================================
#  SmartVacations - Enterprise 1.0
#  (by Leonardo Baladão and Marcio Roberto Cordeiro - 2025)
# =========================================================

from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Boolean, JSON, DateTime
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    manager = Column(String)
    budget = Column(Float)
    currency_code = Column(String, default="BRL")
    start_date = Column(String)  # ISO Date string
    end_date = Column(String)    # ISO Date string
    status = Column(String)      # PLANNING, IN_PROGRESS...
    description = Column(String, nullable=True)
    max_concurrency_percent = Column(Integer, default=10)
    preferred_start_weekday = Column(Integer, default=1)
    country_code = Column(String, default="BR")

    # Relacionamento M:N com Clients (via tabela intermediaria se necessario, mas aqui simplificado para 1:N ou M:N logico)
    # Por simplicidade, vamos assumir que Client tem ProjectIDs armazenados como string JSON ou relacionamento simples.
    # Mas para estrutura relacional correta:
    # clients = relationship("Client", back_populates="projects") 

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    contact_person = Column(String, nullable=True)
    email = Column(String, nullable=True)
    status = Column(String, default="ACTIVE")
    
    # Armazenando IDs de projetos como string separada por virgula ou JSON (SQLite limitation for Arrays without extensions)
    # Em Postgres usariamos ARRAY(String). Aqui, vamos simplificar ou criar tabela associativa
    # Para o MVP SQLite: "PRJ-STF01,PRJ-OTHER"
    project_ids_str = Column(String, default="") 

    employees = relationship("Employee", back_populates="client")

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    admission_date = Column(String) # ISO Date YYYY-MM-DD
    rate = Column(Float)
    
    client_id = Column(Integer, ForeignKey("clients.id"))
    project_id = Column(String, ForeignKey("projects.id")) # Contexto atual
    
    local = Column(String, default="São Paulo")

    client = relationship("Client", back_populates="employees")
    project = relationship("Project")

class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    project_id = Column(String, ForeignKey("projects.id"))
    
    # Armazena a requisição original (configuração) e o resultado (grid) como JSON
    configuration = Column(JSON)
    result = Column(JSON)
    
    project = relationship("Project")
