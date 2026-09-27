# Cofre de Senhas — Mobile

App mobile (iOS/Android) para gerenciamento de senhas, construído com **Expo SDK 57**, **Expo Router** e **TypeScript**.

## Estado atual

| Módulo | Status |
| --- | --- |
| Login | ✅ Funcional |
| Cadastro | ✅ Funcional |
| Rotas protegidas | ✅ `Stack.Protected` |
| Sessão persistente | ✅ SecureStore + restauração no cold start |
| Cofre de senhas (CRUD) | 🚧 Não implementado |

> O app ainda **não** cria, edita ou exclui entradas. A tela inicial é um placeholder honesto que deixa isso explícito.

## Pré-requisitos

- Node.js 20+
- Para iOS: macOS com Xcode
- Para Android: Android Studio
- **Development build** (não Expo Go) — o app usa `expo-secure-store`, um módulo nativo

## Configuração

### 1. Instale as dependências

```bash
npm install
```

### 2. Configure o ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com a URL da sua API:

| Onde o app roda | Valor |
| --- | --- |
| Web | `http://localhost:8080` |
| Simulador iOS | `http://localhost:8080` |
| Emulador Android | `http://10.0.2.2:8080` |
| Celular físico | `http://192.168.x.x:8080` (IP da sua máquina na rede) |

Sem `EXPO_PUBLIC_API_URL`, o app assume um fallback local conforme a plataforma
— suficiente para desenvolvimento, **obrigatório substituí-lo antes de publicar**.

> Variáveis `EXPO_PUBLIC_*` são embutidas em texto plano no bundle. Nunca coloque segredos ali.

### 3. Rode

```bash
npm run web       # navegador
npm run ios       # simulador iOS
npm run android   # emulador Android
```

Para testar em dispositivo físico, gere um development build:

```bash
npx expo run:ios
npx expo run:android
```

## Scripts

```bash
npm start        # dev server
npm run web      # dev server no navegador
npm run lint     # ESLint
npm run typecheck # TypeScript em modo estrito
npm run check    # typecheck + lint
```

## Arquitetura

```
src/
├── app/                      # Rotas (Expo Router — cada arquivo é uma tela)
│   ├── _layout.tsx           # Providers + Stack.Protected (controle de acesso)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (app)/
│       ├── _layout.tsx
│       └── index.tsx         # Tela do cofre
├── components/ui/            # Componentes reutilizáveis (Button, TextField, ...)
├── config/env.ts             # URL da API, timeouts — única fonte de verdade
├── constants/theme.ts        # Design tokens (cores, espaçamento, raios)
├── contexts/AuthContext.tsx  # Estado de autenticação
├── hooks/                    # useAuth, useAuthForm, useAppTheme
├── services/
│   ├── api.ts                # Cliente HTTP + interceptadores
│   ├── api-error.ts          # Normalização de erros (ApiError)
│   └── authService.ts        # Contrato com o backend
├── types/auth.types.ts
└── utils/                    # Validação, storage, splash screen
```

### Decisões que valem explicar

**`Stack.Protected` em vez de redirecionamento manual.** O layout raiz declara
quais grupos de rota existem com base na sessão. O Expo Router remove as rotas
bloqueadas do histórico e redireciona sozinho — inclusive em deep links. A
abordagem anterior (`router.replace()` dentro de um `useEffect`) tinha dois
efeitos competindo e mostrava tela em branco na troca de estado de autenticação.

**`authService` é a única camada que conhece o backend.** O backend usa
`nome`/`senha` e responde com um `TokenResponseDTO`; as telas usam `name`/`password`
e um `User`. A tradução acontece em `src/services/authService.ts` e em nenhum outro lugar.

**`tipoUsuario` não é enviado no cadastro.** O papel do usuário é atribuído pelo
backend. Enviar um valor fixo pelo cliente permitiria que qualquer pessoa se
cadastrasse com privilégios arbitrários.

**Erros são tipados.** Toda requisição passa por `request()`, que converte
qualquer falha (axios, timeout, DNS, JSON inválido) em `ApiError` com uma
mensagem pronta para o usuário. As telas nunca inspecionam `error.response.status`.

**Nada de `Alert.alert`.** No react-native-web ele é um no-op silencioso
(`static alert() {}`), então qualquer confirmação — como o logout — pareceria
simplesmente quebrada no navegador. Todas as confirmações passam por
`ConfirmDialog`, que é cross-platform. O botão físico "voltar" do Android está
tratado via `onRequestClose`.

**Token só é lido do storage uma vez.** O interceptor de request do axios é
síncrono, então o token fica em cache em memória e é invalidado por
`setTokenCache()` quando muda.

**Sessão tolerante.** Se o backend ainda não expõe `GET /auth/me`, a sessão é
mantida e apenas o nome do usuário fica indisponível. Quando a rota existir, o
perfil passa a ser preenchido sem nenhuma alteração de código.

## Contrato com o backend

Extraído de `/v3/api-docs` da API (Spring Boot).

| Método | Rota | Enviado | Observações |
| --- | --- | --- | --- |
| `POST` | `/usuarios` | `{ nome, email, senha, tipoUsuario }` | Responde **201** com o usuário criado |
| `POST` | `/auth/login` | `{ email, senha }` | Responde `{ token, tipo, expiracaoEm }` |
| `PUT` | `/usuarios/{id}` | `{ email, nome, tipoUsuario, senha? }` | Não usado ainda |
| `GET` | `/usuarios/{id}` | — | Não usado ainda |
| `POST` | `/api/senhas` | `{ titulo, login, senha, url?, observacoes? }` | ⏳ CRUD do cofre, não implementado |
| `PUT` | `/api/senhas/{id}` | idem | ⏳ |
| `GET` | `/api/senhas/usuario/{usuarioId}` | — | ⏳ |

### Restrições validadas no formulário

| Campo | Backend | App |
| --- | --- | --- |
| `nome` | 2..100 | 3..100 |
| `senha` | min 8 | min 8 |
| `email` | min 1 | regex com TLD |
| `tipoUsuario` | `ADMIN` \| `USUARIO_LEIGO` | `USUARIO_LEIGO` (ver abaixo) |

### Formato de erro

```jsonc
// 400 — validação por campo
{ "erro": "Erro de validação nos campos da requisição.",
  "campos": [{ "campo": "senha", "mensagem": "A senha deve ter no mínimo 8 caracteres." }] }

// 409 — e-mail duplicado (mensagem plana, sem `campos`)
{ "erro": "O e-mail informado já está cadastrado no sistema: ..." }
```

O `ApiError` normaliza isso e as mensagens de `campos` são aplicadas
automaticamente ao campo correspondente do formulário.

### Sobre `tipoUsuario`

O campo é **obrigatório** no backend, então precisa ser enviado. O app envia
`USUARIO_LEIGO` por padrão — o menos privilegiado.

Isso é deliberado. O código original fixava `ADMIN`, o que permitiria que
qualquer pessoa se cadastrasse como administradora bastando editar um valor no
cliente. Se você precisar criar contas administrativas de propósito, defina
`EXPO_PUBLIC_TIPO_USUARIO_PADRAO=ADMIN` — e saiba que isso reabre a porta para
qualquer outro. A recomendação é que o backend exponha um endpoint separado
para criação de admins, protegido por autorização.

### CORS

A API precisa aceitar a origem do app para funcionar no **navegador**
(ex.: `http://localhost:8081`). Em iOS e Android não há CORS — só importa em
web.

### Perfil do usuário logado

A API atual **não tem** rota de perfil. Por isso `EXPO_PUBLIC_PROFILE_ENDPOINT`
vazio por padrão: chamar uma rota inexistente gerava `500` nos logs do servidor
a cada abertura e a cada login, sem trazer nada. A sessão funciona normalmente
nesse estado — só o nome na tela inicial fica genérico.

Para habilitar quando a rota existir, aponte para ela e nada mais muda:

```bash
EXPO_PUBLIC_PROFILE_ENDPOINT=/auth/me
```

> Alternativa sem endpoint novo: o JWT traz o e-mail na claim `sub`. Dá para
> decodificar o token no cliente e mostrar a conta, mas o **nome** continua
> indisponível.


## Segurança

- Token em `expo-secure-store` (Keychain no iOS, EncryptedSharedPreferences no Android).
- Na web há fallback para `localStorage` — aceitável só em desenvolvimento.
- `EXPO_PUBLIC_*` não deve conter segredos; use EAS Environment variables.

## Pendências conhecidas

- [ ] CRUD do cofre (criar, editar, excluir, favoritar, buscar)
- [ ] Refresh de token
- [ ] Tela "esqueci minha senha"
- [ ] Testes (unitários de auth/validação + E2E do fluxo de login)
- [ ] `eas.json` e CI
- [ ] Criptografia local das entradas
