
# Colégio Lumos - Dashboard Administrativo

Sistema de gestão escolar completo desenvolvido com React, TypeScript e Tailwind CSS.

## 🚀 Tecnologias

- **React 19** + **TypeScript**
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **shadcn/ui** para componentes
- **Lucide React** para ícones
- **Recharts** para gráficos
- **Framer Motion** para animações
- **Radix UI** para componentes acessíveis

## 📦 Setup

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🎨 Funcionalidades

### Layout Responsivo
- **Desktop**: Sidebar fixa + conteúdo principal
- **Tablet (1024px)**: Layout adaptado
- **iPad Mini (744px)**: Componentes empilhados
- **Mobile (≥360px)**: Sidebar em sheet lateral

### Dark Mode
- Toggle no header
- Persistência via classe `dark` no HTML
- Cores otimizadas para ambos os temas

### Componentes Principais

#### Layout
- `Topbar`: Navegação superior com logo, seletor de ano letivo, notificações e perfil
- `Sidebar`: Menu lateral colapsável com navegação hierárquica
- `PageHeader`: Breadcrumb, título e seletor de aluno

#### Widgets
- `WelcomeBanner`: Banner de boas-vindas personalizado
- `DonutMetric`: Métricas com gráficos donut (Recharts)
- `OccurrencesList`: Lista de ocorrências dos alunos
- `MessagesList`: Últimas mensagens recebidas
- `MiniCalendar`: Calendário compacto com eventos
- `UpcomingEvents`: Próximos eventos agendados

## 📁 Estrutura de Arquivos

```
src/
├── components/
│   ├── layout/          # Componentes de layout
│   ├── ui/              # Componentes base (shadcn/ui)
│   └── widgets/         # Widgets específicos do dashboard
├── mocks/               # Dados mockados
├── pages/
│   └── dashboard/       # Páginas do dashboard
└── router/              # Configuração de rotas
```

## 🎯 Dados Mockados

Os dados estão em `src/mocks/dashboard-data.ts`:
- Métricas de alunos, professores e funcionários
- Lista de ocorrências
- Mensagens recentes
- Eventos do calendário

## ♿ Acessibilidade

- Navegação por teclado completa
- Labels ARIA apropriados
- Contraste AA em ambos os temas
- Foco visível em todos os elementos interativos

## 📱 Breakpoints

- `lg`: 1024px+ (desktop)
- `md`: 768px+ (tablet)
- `sm`: 640px+ (mobile grande)
- Base: 360px+ (mobile)

## 🎨 Customização

### Cores
Configuradas em `src/index.css` com variáveis CSS para light/dark mode.

### Componentes
Todos os componentes seguem o padrão shadcn/ui e podem ser customizados via Tailwind CSS.

### Animações
Micro-interações implementadas com Framer Motion para melhor UX.
