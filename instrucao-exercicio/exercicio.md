# Exercício de Fixação

## Ordenação, Contagem, Busca por Id, Atualização e Remoção de Alunos

> Continuação do projeto da disciplina — **Node.js · Express · Prisma**

---

## ⚠️ AVISO IMPORTANTE — LEIA ANTES DE COMEÇAR

- Este exercício é **INDIVIDUAL**.
- A entrega deve ser feita pelo **GitHub**, com um repositório contendo o projeto atualizado, **até o dia da primeira avaliação**.
- É **obrigatório um commit separado para cada requisito implementado**:
  1. um commit para a **ordenação** (incluindo a contagem total);
  2. um commit para o **findUnique**;
  3. um commit para o **update**;
  4. um commit para o **delete**.
- Commits genéricos, únicos ou fora dessa organização **não serão aceitos**.

---

## Contexto: o que já está pronto

Este exercício continua o projeto que já está sendo desenvolvido em sala: uma **API de Alunos** com Node.js, Express e Prisma, organizada em **Model, Service, Controller e Routes**, com um sistema de exceções personalizadas (`ApiError` e `AlunoInvalidoError`).

Hoje o projeto já tem, funcionando:

- `GET /alunos` — lista paginada de alunos (com `page` e `pageSize` via query string).
- `POST /alunos` — cadastro de aluno, validando `nome` e `email` obrigatórios, lançando `AlunoInvalidoError` quando faltam.
- A classe base `ApiError` (`src/errors/ApiError.js`), da qual **toda exceção personalizada deve herdar**.

### O `findMany` atual (Service)

```js
async findMany(page, pageSize){
  const alunos = await prisma.aluno.findMany({
    skip: (page-1)*pageSize,
    take: Number(pageSize)
  });
  return alunos;
}
```

### O `findMany` atual (Controller)

```js
async findMany(request, response){
  let {page, pageSize} = request.query;
  page ||= 1;
  pageSize ||= 10;
  const alunos = await alunoService.findMany(page, pageSize);
  return response.status(200).json({alunos});
}
```

É a partir deste ponto que você vai trabalhar. Os requisitos abaixo **não vêm com o código pronto** — a ideia é que você aplique os conceitos já estudados (Service, Controller, exceções personalizadas) para resolvê-los.

---

## Objetivo do exercício

Você vai evoluir a API de Alunos com quatro entregas:

1. **Ordenação** — permitir ordenar a listagem de alunos por um campo e uma direção informados via query string, e incluir a contagem total de alunos na resposta.
2. **findUnique** — criar a rota de busca de um único aluno pelo id, tratando o caso de aluno inexistente com uma exceção personalizada.
3. **update** — criar a rota de atualização de um aluno, tratando os erros que podem ocorrer.
4. **delete** — criar a rota de remoção de um aluno, tratando os erros que podem ocorrer.

> **OBSERVAÇÃO**
> Siga o **mesmo padrão de arquitetura** já usado no projeto:
> - a lógica de acesso ao Prisma e as validações de negócio ficam no **Service**;
> - o **Controller** lê a requisição, chama o Service e trata os erros com `try...catch`, devolvendo o status correto.

---

## Requisito 1 — Ordenação (`orderBy` via query string)

A rota `GET /alunos` deve aceitar **dois novos parâmetros** de query string, além de `page` e `pageSize` já existentes:

| Parâmetro | Descrição |
|---|---|
| `orderBy` | O nome do campo pelo qual ordenar (ex.: `nome`, `email`, `createdAt`). |
| `order` (ou `tipoOrdenacao`) | A direção da ordenação: `"asc"` (crescente) ou `"desc"` (decrescente). |

### Exemplos de uso

```
GET /alunos?orderBy=nome&order=asc
GET /alunos?orderBy=createdAt&order=desc
GET /alunos?page=2&pageSize=5&orderBy=email&order=asc
```

### O que considerar

- Se `orderBy` ou `order` **não forem enviados**, defina **valores padrão razoáveis** (ex.: ordenar por `id`, de forma crescente).
- O Prisma aceita um objeto `orderBy` no `findMany`, no formato `{ campo: "asc" }` ou `{ campo: "desc" }` — consulte a documentação do método `findMany` para montar esse objeto a partir dos parâmetros recebidos.
- O que deve acontecer se alguém enviar um valor de `order` diferente de `"asc"` ou `"desc"`? Pense em como tratar essa situação **sem quebrar a aplicação**.

### Contagem do total de alunos

Além da ordenação, a resposta da rota `GET /alunos` deve informar também o **total de alunos cadastrados no banco** — não apenas os que aparecem na página atual. Isso é essencial para quem for construir uma tela de paginação (saber quantas páginas existem no total).

**Formato esperado da resposta (exemplo):**

```json
{
  "alunos": [ ... ],
  "total": 42
}
```

- O Prisma tem um método próprio para contar registros de uma tabela, opcionalmente com filtros — pesquise por `count()` na documentação do Prisma Client.
- Pense em como estruturar o retorno do Service: ele pode devolver um objeto com os alunos e o total juntos.

---

## Requisito 2 — `findUnique` por id

Crie a rota `GET /alunos/:id`, que deve buscar e devolver **um único aluno** pelo seu `id`.

### Comportamento esperado

- Se o aluno **existir**, devolver os dados dele com status **200**.
- Se o aluno **não existir**, a API deve responder com status **404** e uma mensagem clara, do tipo `"Aluno não encontrado"`.

### O que fazer

- Crie uma **nova classe de exceção** (ex.: `AlunoNaoEncontradoError`), seguindo exatamente o mesmo padrão de `AlunoInvalidoError`: um arquivo dentro de `src/errors/`, estendendo `ApiError`, com mensagem e status padrão (**404**).
- No **Service**, use o método `findUnique` do Prisma Client para buscar o aluno pelo id. Se o resultado vier vazio (`null`), lance a nova exceção.
- No **Controller**, trate a chamada ao Service com `try...catch`, do mesmo jeito que já é feito no `create` — usando `e.statusCode` e `e.message` na resposta de erro.

> **DICA**
> O `id` chega para o Controller como **texto**, dentro de `request.params`. O campo `id` no `schema.prisma` é do tipo `Int` — você provavelmente vai precisar **converter** esse valor antes de passá-lo ao Prisma.

---

## Requisito 3 — `update`

Crie a rota de atualização de um aluno (`PUT` ou `PATCH /alunos/:id`), permitindo alterar `nome` e/ou `email`.

### Erros que podem ocorrer — pense em cada um

- **Aluno não encontrado:** o id enviado na URL não corresponde a nenhum aluno existente. Reaproveite a exceção criada no Requisito 2.
- **Dados inválidos:** o corpo da requisição vem vazio, ou sem nenhum campo válido para atualizar.
- **Email duplicado:** o novo email informado já pertence a outro aluno cadastrado (lembre-se de que `email` é `@unique` no schema — o que o Prisma faz se você tentar salvar um valor duplicado nesse campo?).

### O que fazer

- Decida se cada um desses casos merece uma **exceção própria** ou se pode **reaproveitar uma exceção já existente** — justifique sua escolha **comentando no código**.
- Lembre-se do padrão do projeto:
  - a decisão de **"o que deu errado"** é do **Service** (`throw`);
  - a decisão de **"como responder"** é do **Controller** (`catch`).
- Pesquise o método `update` do Prisma Client e como ele espera receber o `where` (para localizar o registro) e o `data` (com os campos a atualizar).

---

## Requisito 4 — `delete`

Crie a rota de remoção de um aluno (`DELETE /alunos/:id`).

### Erros que podem ocorrer

- **Aluno não encontrado:** o id enviado não corresponde a nenhum aluno existente (reaproveite a exceção do Requisito 2).

### O que fazer

- No **Service**, verifique se o aluno existe antes de tentar removê-lo (ou trate o erro que o Prisma lança ao tentar deletar um registro inexistente).
- Escolha o **status HTTP correto** para uma remoção bem-sucedida — pense no que essa resposta deveria (ou não) conter no corpo.
- Pesquise o método `delete` do Prisma Client e como ele localiza o registro a ser removido.

---

## Resumo das rotas a implementar

| Verbo | Rota | O que deve fazer |
|---|---|---|
| `GET` | `/alunos` | Listar com paginação, ordenação (`orderBy`/`order`) e total de registros |
| `GET` | `/alunos/:id` | Buscar um aluno pelo id (404 se não existir) |
| `PUT`/`PATCH` | `/alunos/:id` | Atualizar um aluno (tratando os erros possíveis) |
| `DELETE` | `/alunos/:id` | Remover um aluno (tratando os erros possíveis) |

---

## Como entregar

- **Individual:** este exercício não deve ser feito em dupla ou grupo.
- **Prazo:** até o dia da primeira avaliação.
- **Onde:** em um repositório no GitHub, contendo o projeto completo (incluindo o que já foi feito em sala).

### Um commit por requisito

A organização dos commits **faz parte da avaliação**. São esperados, no mínimo, **quatro commits**, cada um contendo exatamente o código do requisito correspondente:

1. **Commit da ordenação** — inclui o `orderBy`, a direção da ordenação e a contagem total (já que ambos alteram o mesmo `findMany`).
2. **Commit do findUnique** — inclui a nova rota, o Service, o Controller e a nova exceção de aluno não encontrado.
3. **Commit do update** — inclui a rota, o Service e o Controller da atualização.
4. **Commit do delete** — inclui a rota, o Service e o Controller da remoção.

### Sugestão de mensagens de commit

```
feat: adiciona ordenacao e contagem total no findMany de alunos
feat: adiciona busca de aluno por id (findUnique)
feat: adiciona atualizacao de aluno (update)
feat: adiciona remocao de aluno (delete)
```

> Commits únicos, genéricos (ex.: "ajustes", "correções") ou que misturem mais de um requisito **não atendem ao critério de entrega**.

---

## Checklist antes de entregar

- [ ] `GET /alunos` aceita `orderBy` e `order` (ou `tipoOrdenacao`) via query string.
- [ ] `GET /alunos` devolve também o total de alunos cadastrados.
- [ ] Existe uma nova exceção personalizada para "aluno não encontrado", estendendo `ApiError`.
- [ ] `GET /alunos/:id` devolve 200 com o aluno, ou 404 quando não existir.
- [ ] `PUT`/`PATCH /alunos/:id` atualiza o aluno e trata os erros possíveis.
- [ ] `DELETE /alunos/:id` remove o aluno e trata o erro de aluno inexistente.
- [ ] Todas as rotas novas usam `try...catch` no Controller, seguindo o padrão do projeto.
- [ ] O repositório no GitHub tem um commit específico para cada requisito (ordenação, findUnique, update, delete).
- [ ] Testei todas as rotas (casos de sucesso e de erro) antes de entregar.