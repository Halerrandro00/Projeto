# Mini Loja com Carrinho de Compras (NoSQL)

Este é um projeto de exemplo de uma pequena loja virtual com um carrinho de compras, construído com Node.js, Express, e MongoDB. O projeto demonstra um CRUD completo e a modelagem de dados orientada a documentos.

## Funcionalidades

- Listagem de produtos.
- Adicionar produtos ao carrinho.
- Visualizar o carrinho de compras com total e quantidade de itens.
- Remover itens do carrinho.
- Exportar os dados do carrinho em formato JSON.

## Tecnologias e Dependências

- **Backend**: Node.js, Express.js
- **Banco de Dados**: MongoDB (com Mongoose como ODM)
- **Frontend**: HTML5, CSS3, JavaScript (com Fetch API)

## Configuração do Banco de Dados

O projeto utiliza MongoDB. Você pode usar uma instância local ou um serviço em nuvem como o MongoDB Atlas.

1.  Certifique-se de que o MongoDB está instalado e rodando na sua máquina.
2.  A string de conexão está definida no arquivo `server.js`. O padrão é `mongodb://localhost:27017/shopping_cart_db`.
3.  Altere a variável `MONGO_URI` em `server.js` se estiver usando uma configuração diferente (ex: MongoDB Atlas).

## Como Rodar o Projeto

1.  **Clone o repositório:**
    ```bash
    git clone <url-do-seu-repositorio>
    cd nosql-shopping-cart
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Inicie o servidor:**
    ```bash
    npm start
    ```

4.  Abra seu navegador e acesse `http://localhost:3000`.

## Populando o Banco com Produtos

Para adicionar produtos à loja, você pode usar uma ferramenta como Postman ou `curl` para fazer uma requisição `POST` para o endpoint `/api/products`.

**Exemplo com `curl`:**
```bash
curl -X POST http://localhost:3000/api/products \
-H "Content-Type: application/json" \
-d '{
  "name": "Livro NoSQL",
  "price": 49.90,
  "description": "Um livro sobre bancos de dados NoSQL.",
  "imageUrl": "https://m.media-amazon.com/images/I/51iQ43mE8NL.jpg"
}'
```