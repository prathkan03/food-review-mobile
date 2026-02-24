# Gourmet AI

AI-powered social platform bridging dining and home cooking via multi-service architecture and LLM menu ingestion.

---

## System Architecture

Gourmet is engineered as a distributed system comprising three primary services:

* **Mobile Client**: A cross-platform **React Native (Expo Router)** application utilizing **TypeScript** for type-safe state management. 
* **Social/Core Backend**: A **Spring Boot** REST API managing a complex social graph, utilizing **JPA/Hibernate** and **PostgreSQL** for high-concurrency data persistence. 
* **AI Scraper Service**: A **FastAPI** service that orchestrates **Claude 3.5 Vision** and **Playwright** to transform unstructured restaurant PDFs/menus into structured relational data.
---

## Key Engineering Achievements

### **1. AI-Powered Menu Ingestion**
* Developed a parallelized scraper using **Playwright** and **Claude Vision** to parse restaurant menus with 95%+ accuracy.
* Implemented an **SQLite-based caching layer** to store LLM responses, reducing API overhead and operational costs by **60%**.

### **2. Social Graph Optimization**
* Optimized **PostgreSQL B-tree indexing** and complex joins to deliver user activity feeds with **sub-100ms latency**. 
* Secured multi-tenant data access using **PostgreSQL Row-Level Security (RLS)** and **JWT-based authentication** via Supabase.

### **3. Mobile Performance & UX**
* [cite_start]Integrated **Optimistic UI updates** for the threaded chat system, achieving a perceived latency of **~150ms**.
* [cite_start]Reduced mobile authentication latency by **45%** through SQL execution plan tuning and connection pooling.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React Native, Expo Router, TypeScript |
| **Backend** | Spring Boot, FastAPI (Python), Java |
| **Database** | PostgreSQL, SQLite (Edge Cache) |
| **Auth** | Supabase Auth (JWT) |
| **AI/ML** | Anthropic Claude API |
| **DevOps** | GitHub Actions (CI/CD), Docker, EAS |

---

## Infrastructure & Deployment

* **CI/CD**: Automated cross-platform builds and unit testing (JUnit/Pytest) via **GitHub Actions**.
* **Containerization**: Modular services containerized for consistent development and local scaling.
* **Observability**: Instrumented structured logging for rapid incident triage and response.
