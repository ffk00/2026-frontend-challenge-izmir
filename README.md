# Jotform Frontend Challenge Project

## User Information
Please fill in your information after forking this repository:

- **Name**: Fatih Furkan Keser

## Project Description
Saving Podo is a frontend investigation tool built for the Jotform challenge. It loads five live Jotform forms, normalizes their messy submissions into one case file, resolves misspelled people and clustered locations at runtime, and lets the user investigate the case through a synced map, timeline, actor directory, location directory, slide-over details, and global search.

The app is intentionally data-driven: names, places, events, aliases, and connections come from the Jotform API response rather than hardcoded story data.

## Getting Started
Requirements:

- Node.js 20+
- Jotform API key access for the challenge forms

Setup:

```bash
npm install
```

Create `.env.local` in the project root:

```bash
VITE_JOTFORM_KEYS=key1,key2,key3,key4,key5
```

Run locally:

```bash
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

Validate before review:

```bash
npm run lint
npm run build
```

If a form schema changes, update only `src/data/forms.ts`.

# 🚀 Challenge Duyurusu

## 📅 Tarih ve Saat
Cumartesi günü başlama saatinden itibaren üç saattir.

## 🎯 Challenge Konsepti
Bu challenge'da, size özel hazırlanmış bir senaryo üzerine web uygulaması geliştirmeniz istenecektir. Challenge başlangıcında senaryo detayları paylaşılacaktır.Katılımcılar, verilen GitHub reposunu fork ederek kendi geliştirme ortamlarını oluşturacaklardır.

## 📦 GitHub Reposu
Challenge için kullanılacak repo: https://github.com/cemjotform/2026-frontend-challenge-izmir

## 🛠️ Hazırlık Süreci
1. GitHub reposunu fork edin
2. Tercih ettiğiniz framework ile geliştirme ortamınızı hazırlayın
3. Hazırladığınız setup'ı fork ettiğiniz repoya gönderin

## 💡 Önemli Notlar
- Katılımcılar kendi tercih ettikleri framework'leri kullanabilirler
