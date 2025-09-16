# Mini Loja com Carrinho de Compras (Projeto NoSQL)

Este é um projeto de uma mini loja virtual com funcionalidade de carrinho de compras, desenvolvido como parte da disciplina de Banco de Dados NoSQL.

## 1. Como Rodar o Projeto

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 16 ou superior)
- `npm` (geralmente vem com o Node.js)
- Uma instância do [MongoDB](https://www.mongodb.com/atlas/database) (recomenda-se o MongoDB Atlas, que é gratuito)

### Passos

1.  **Clone o repositório:**
    ```bash
    git clone <url-do-seu-repositorio>
    cd <pasta-do-projeto>
    ```

2.  **Instale as dependências:**
    ```bash
    npm install express mongoose cors jsonwebtoken bcryptjs dotenv
    ```

3.  **Configure o Banco de Dados:**
    - Renomeie (ou copie) o arquivo `.env.example` para `.env`.
    - Abra o arquivo `.env` e substitua os valores de placeholder (`<user>`, `<password>`, etc.) pelos seus dados reais do MongoDB Atlas e uma chave secreta para o JWT.
    - Exemplo do conteúdo do arquivo `.env`:
    ```
    # String de conexão do MongoDB
    MONGO_URI=mongodb+srv://<user>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority

    # Chave secreta para os tokens JWT
    JWT_SECRET=sua_chave_secreta_super_secreta_aqui
    ```
    - **Importante:** O arquivo `.env` contém informações sensíveis e não deve ser enviado para o controle de versão (Git). Certifique-se de que seu arquivo `.gitignore` contém a linha `.env`.

4.  **(Opcional) Popule o banco de dados com produtos de exemplo:**
    - Para adicionar produtos e um **usuário administrador** de exemplo, execute:
    ```bash
    node seeder.js
    ```
    - O usuário administrador padrão é:
      - **Email:** `admin@example.com`
      - **Senha:** `adminpassword`
    - Para limpar todos os dados (produtos, carrinhos e usuários), execute:
    ```bash
    node seeder.js -d
    ```

5.  **Inicie o servidor:**
    ```bash
    npm start
    ```

6.  **Acesse a aplicação:**
    Abra seu navegador e acesse `http://localhost:3000`. Você será redirecionado para a página de produtos.

## 2. Dependências Principais

- **Express.js**: Framework para criar o servidor e a API REST.
- **Mongoose**: ODM (Object Data Modeling) para interagir com o MongoDB de forma estruturada.
- **CORS**: Middleware para permitir requisições entre o front-end e o back-end.
- **jsonwebtoken**: Para gerar tokens de autenticação (JWT).
- **bcryptjs**: Para criptografar senhas.
- **dotenv**: Para gerenciar variáveis de ambiente.

## 3. Modelagem de Dados e Justificativa

Foi escolhido o **MongoDB**, um banco de dados orientado a documentos. Esta escolha se justifica pela flexibilidade que o modelo de documentos oferece, sendo ideal para um e-commerce onde produtos podem ter atributos variados.

- **Coleção `products`**: Armazena os produtos da loja. Cada produto é um documento com `name`, `price`, `description`, etc. Foi criado um índice no campo `name` para otimizar buscas.
- **Coleção `carts`**: Armazena os carrinhos de compra. Cada carrinho é um documento vinculado a um `userId` e contém um array de `items`. Esta abordagem de incorporar os itens do carrinho dentro do documento do carrinho é eficiente para leitura, pois todos os dados do carrinho são obtidos em uma única consulta.
 - **Coleção `users`**: Armazena os dados dos usuários, incluindo nome, email e senha criptografada. Possui um campo `isAdmin` para controle de acesso a rotas administrativas.

## 4. Funcionalidades
- Autenticação de Usuários (Registro e Login com JWT).
- Listagem de produtos.
- Carrinho de compras funcional (Adicionar, Remover, Visualizar).
- Exportação de dados do carrinho em JSON.
- **Painel de Administração** para gerenciamento de produtos (CRUD - Criar, Ler, Atualizar, Deletar).