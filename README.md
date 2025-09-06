# 🥗 NeutriCheck – Your AI-powered Food Label Health Checker  

## 📌 Overview  
NeutriCheck is a **health-awareness web application** that helps users make informed food choices.  
By simply capturing the image of a product’s **label (ingredients, additives, preservatives, colors, nutrition values)**, the app analyzes and identifies:  
- ✅ Which ingredients are safe  
- ⚠️ Which additives are harmful or risky  
- 🚫 Which chemicals are banned in certain countries  
- 🧬 Possible health effects of ingredients  

---

## 🚀 Features  
- 📸 Upload or capture product label images  
- 🔎 OCR extraction of text using **Google Vision API**  
- 📊 Ingredient database with classification (safe, harmful, banned)  
- 💡 Instant health insights with explanation of each chemical  
- ⚛️ Modern and responsive UI built with **React + TailwindCSS**  
- 🗄️ Backend powered by **Node.js + Express**  
- 🛢️ Data stored in **PostgreSQL**  

---

## 🛠️ Tech Stack  
**Frontend:** React, TailwindCSS  
**Backend:** Node.js, Express.js  
**Database:** PostgreSQL  
**Image to Text (OCR):** Google Vision API  
**Version Control:** Git & GitHub  

---

## 📂 Project Structure  
```bash
NeutriCheck/
│── frontend/          # React + Tailwind UI
│── backend/           # Node.js + Express server
│── database/          # PostgreSQL schema & queries
│── docs/              # Documentation (future improvements, notes)
│── README.md          # Project overview
```

## ⚡ Installation & Setup
1.Clone the repository
```bash
git clone https://github.com/your-username/NeutriCheck.git
cd NeutriCheck
```
1.Setup Frontend
```bash
cd frontend
npm install
npm start
```
3.Setup Backend
```bash
cd backend
npm install
npm run dev
```
4.Configure Database (PostgreSQL)
-Import schema from database/schema.sql
-Update .env with your DB credentials
-Setup Google Vision API
-Create a Google Cloud project
-Enable Vision API
-Download credentials JSON and set path in .env

##Future Improvements
📱 Mobile app version (React Native / Flutter)
🌍 Multi-country ingredient & regulation support
🤖 AI-based personalized health recommendations
🔒 User authentication for saved history

👩‍💻 Author
Amit Kumar Madina

