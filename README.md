# Gourmet 🍽️

An AI-augmented social platform for restaurant discovery and culinary exploration. Gourmet bridges the gap between dining out and home cooking by leveraging a **multi-service architecture** to turn restaurant experiences into actionable data.

---

## 🏗️ System Architecture

Gourmet is engineered as a distributed system comprising three primary services:

* [cite_start]**Mobile Client**: A cross-platform **React Native (Expo Router)** application utilizing **TypeScript** for type-safe state management. 
* [cite_start]**Social/Core Backend**: A **Spring Boot** REST API managing a complex social graph, utilizing **JPA/Hibernate** and **PostgreSQL** for high-concurrency data persistence. 
* [cite_start]**AI Scraper Service**: A **FastAPI** service that orchestrates **Claude 3.5 Vision** and **Playwright** to transform unstructured restaurant PDFs/menus into structured relational data. [cite: 153]

[Image of Spring Boot and FastAPI microservices architecture with PostgreSQL and Redis]

---

## 🚀 Key Engineering Achievements

### **1. AI-Powered Menu Ingestion**
* [cite_start]Developed a parallelized scraper using **Playwright** and **Claude Vision** to parse restaurant menus with 95%+ accuracy. [cite: 153]
* [cite_start]Implemented an **SQLite-based caching layer** to store LLM responses, reducing API overhead and operational costs by **60%**. [cite: 153]

### **2. Social Graph Optimization**
* [cite_start]Optimized **PostgreSQL B-tree indexing** and complex joins to deliver user activity feeds with **sub-100ms latency**. 
* [cite_start]Secured multi-tenant data access using **PostgreSQL Row-Level Security (RLS)** and **JWT-based authentication** via Supabase. [cite: 157]

### **3. Mobile Performance & UX**
* [cite_start]Integrated **Optimistic UI updates** for the threaded chat system, achieving a perceived latency of **~150ms**. [cite: 157]
* [cite_start]Reduced mobile authentication latency by **45%** through SQL execution plan tuning and connection pooling. [cite: 157]

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React Native, Expo Router, TypeScript |
| **Backend** | Spring Boot, FastAPI (Python), Java |
| **Database** | PostgreSQL, SQLite (Edge Cache) |
| **Auth** | Supabase Auth (JWT) |
| **AI/ML** | Anthropic Claude API |
| **DevOps** | GitHub Actions (CI/CD), Docker, EAS |

---

## 📦 Infrastructure & Deployment

* [cite_start]**CI/CD**: Automated cross-platform builds and unit testing (JUnit/Pytest) via **GitHub Actions**. [cite: 157]
* **Containerization**: Modular services containerized for consistent development and local scaling.
* [cite_start]**Observability**: Instrumented structured logging for rapid incident triage and response. [cite: 137]
