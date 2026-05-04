# DESIGN.md — Piano Redesign Frontend

## Obiettivo
Elevare il frontend della piattaforma con un design system architettonico/minimalista: sfondo mesh gradient chiaro, cards nere monolitiche, font Manrope, glassmorphism sottile. Sidebar collassabile a sinistra.

---

## 1. Palette Colori (Monochromatic — The Design System)

| Ruolo | Valore | Uso |
|---|---|---|
| Background | `#fbf8ff` | Sfondo pagina (mesh gradient verso `#e8e7f1`) |
| Surface (card dark) | `#09090b` | Cards principali — monolith look |
| Surface (card mid) | `#18181b` | Cards secondarie, sidebar |
| Surface container | `#eeedf7` | Container leggeri |
| Border dark | `rgba(255,255,255,0.1)` | Bordo rim-light su cards scure |
| Border light | `#c8c5ca` | Bordo su elementi chiari |
| Text on dark | `#ffffff` | Titoli su cards scure |
| Text secondary on dark | `#d4d4d8` | Body text su cards scure (zinc-300) |
| Text on light | `#1a1b22` | Testo su sfondo chiaro |
| Text muted | `#78767b` | Labels, metadati |
| Primary button | `#ffffff` bg + `#09090b` text | CTA principale |
| Secondary button | `#1c1b1d` bg + `#ffffff` text | Azioni secondarie |
| Error | `#ba1a1a` | Errori, delete |
| Error container | `#ffdad6` | Background badge errore |

---

## 2. Typography — Manrope

Font: **Manrope** (Google Fonts)

| Elemento | Size | Weight | Letter-spacing |
|---|---|---|---|
| H1 | 48px | 700 | -0.04em |
| H2 | 32px | 600 | -0.02em |
| H3 | 24px | 600 | -0.01em |
| Body LG | 18px | 400 | 0 |
| Body MD | 16px | 400 | 0 |
| Label SM | 12px | 600 | 0.05em uppercase |

---

## 3. Layout — Sidebar + Content

### Struttura
```
[Sidebar 240px | Content area flex-1]
   |
   |-- Logo "Piattaforma" + subtitle "Enterprise Suite"
   |-- Nav items:
   |     [icon] OneDigit      (active: bg zinc-800, border-left white)
   |     [icon] PulseMargin
   |     [icon] QuoteBuilder
   |-- (spacer)
   |-- [icon] Profile
   |-- [icon] Logout
```

### Sidebar behavior
- **Espansa**: `240px`, icona + label
- **Collassata**: `64px`, solo icona (tooltip su hover)
- **Toggle**: bottone freccia in basso
- **Stato**: `localStorage`
- **Sfondo sidebar**: `#18181b` (dark, non la pagina)
- **Active item**: `bg-zinc-800`, bordo sinistro `2px white`
- **Hover item**: `bg-zinc-800/50`

### App layout
```tsx
<div className="flex h-screen bg-[#fbf8ff]">
  <Sidebar />  // dark, fixed
  <main className="flex-1 overflow-auto">
    // mesh gradient background
    {children}
  </main>
</div>
```

---

## 4. Background — Mesh Gradient

Il background della content area non è flat ma un mesh gradient atmosferico:

```css
background: 
  radial-gradient(ellipse at 20% 50%, #e8e7f1 0%, transparent 60%),
  radial-gradient(ellipse at 80% 20%, #dad9e3 0%, transparent 50%),
  radial-gradient(ellipse at 50% 80%, #eeedf7 0%, transparent 60%),
  #fbf8ff;
```

---

## 5. Elevation & Depth — Cards Monolitiche

### Card dark (principale)
```
bg: #09090b
border: 1px solid rgba(255,255,255,0.08)  // rim-light top+left
border-radius: 0.5rem (8px)
backdrop-filter: blur(12px)
```

### Card light (container)
```
bg: white
border: 1px solid #c8c5ca
border-radius: 0.5rem
box-shadow: 0 1px 3px rgba(0,0,0,0.05)
```

### KPI Cards (PulseMargin style)
- Card scura con numero grande bianco
- Label uppercase zinc-400 in alto
- Stile "monolith" — niente decorazioni

---

## 6. Components

### Bottoni
- **Primary**: `bg-white text-zinc-950 hover:bg-zinc-100 rounded-sm font-semibold`
- **Primary dark context**: `bg-zinc-900 text-white hover:bg-zinc-800`  
- **Secondary**: `bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700`
- **Destructive**: `bg-red-600 text-white hover:bg-red-700`
- Border radius: `rounded` (4px — sharp, architettonico)

### Inputs
- `bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-500`
- Focus: `focus:outline-none focus:border-white focus:ring-1 focus:ring-white`
- Su sfondo chiaro: `bg-white border border-zinc-200 focus:border-zinc-900`

### Badge/Chips
- Dark pill: `bg-zinc-800 text-zinc-300 text-xs px-2 py-0.5 rounded-full`
- Success: `bg-green-950 text-green-400`
- Error: `bg-red-950 text-red-400`

### Dialogs
- Overlay: `bg-black/60 backdrop-blur-sm`
- Modal: `bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl`
- Testo dentro: bianco e zinc-300

### Toast
- `bg-zinc-950 text-white border border-zinc-800 rounded-lg shadow-xl`

### Empty State
- Su sfondo scuro: icona zinc-600, testo zinc-400
- Bottone CTA bianco

---

## 7. Componenti da Creare / Modificare

### Nuovo: `src/components/Sidebar.tsx`
- Client component
- State: `collapsed`, localStorage persist
- Sfondo: `bg-[#18181b]`
- Logo + subtitle
- Nav items con icone lucide-react
- Profile + Logout in fondo

### Modifica: `src/app/app/layout.tsx`
```tsx
<div className="flex h-screen">
  <Sidebar />
  <main className="flex-1 overflow-auto mesh-bg">
    {children}
  </main>
</div>
```

### Elimina: `src/components/Navigation.tsx`

### Modifica: `src/app/layout.tsx`
- Aggiungi import Manrope da Google Fonts

### Modifica: `src/app/globals.css`
- Definisci mesh-bg class
- CSS variables per colori

---

## 8. Icone (lucide-react)

- `LayoutDashboard` — OneDigit
- `TrendingUp` — PulseMargin  
- `FileText` — QuoteBuilder / Contratti
- `Users` — Clienti
- `Package` — Pacchetti
- `FileStack` — Template
- `User` — Profile
- `LogOut` — Logout
- `ChevronLeft/Right` — Collapse sidebar
- `PanelLeftClose/Open` — Toggle sidebar

---

## 9. Ordine Implementazione

```
Step 1: Installa lucide-react + aggiungi Manrope in layout.tsx
Step 2: Aggiorna globals.css (mesh bg, CSS vars)
Step 3: Aggiorna UI components (button, input, card, badge, dialog, toast)
Step 4: Crea Sidebar.tsx (dark, collassabile)
Step 5: Aggiorna app/layout.tsx (flex row)
Step 6: Aggiorna pagine — OneDigit (Clienti, Pacchetti, Contratti)
Step 7: Aggiorna pagine — PulseMargin (Dashboard, Detail)
Step 8: Aggiorna pagine — QuoteBuilder
Step 9: Auth / Login page
Step 10: Smoke test completo
```

---

## Note
- Mobile: sidebar hidden + hamburger (dopo desktop)
- Animazioni: solo `transition-colors duration-150`, niente pesante
- Cards scure per KPI/feature cards, cards bianche per form/table containers
- Niente Stripe, niente team (v1.0)
