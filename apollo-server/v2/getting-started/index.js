const { ApolloServer, gql } = require('apollo-server');
const DataLoader = require('dataloader');

const util = require('util')

const sleep = util.promisify((a, f) => setTimeout(f, a))

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = gql`
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  type Author {
    name: String
    books: [Book]
  }

  # This "Book" type defines the queryable fields for every book in our data source.
  type Book {
    title: String
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    authors: [Author]
  }
`;

const authors = [{ name: 'Kate Chopin' }, { name: 'Paul Auster'} ];

const booksDB = [
  {
    title: 'The Awakening',
    author: authors[0].name,
  },
  {
    title: 'City of Glass',
    author: authors[1].name,
  },
  {
    title: 'Book 1',
    author: authors[1].name,
  },
  {
    title: 'Book 2',
    author: authors[1].name,
  },
];

const batchGetBooksByAuthor = async (authorNames) => {
  console.log('loading', authorNames);
  const books = authorNames.map((authorName) => {
    return booksDB
      .filter(book => book.author === authorName);
  });
  console.log('I only get fired once');
  // Force actual use of the promise loop.
  await sleep(10);
  return books;
};
const bookLoader = new DataLoader(batchGetBooksByAuthor);

// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
const resolvers = {
  Query: {
    authors: () => authors,
  },

  Author: {
    books: async (parent) => {
      console.log('Fetching for', parent.name)
      const result = await bookLoader.load(parent.name);
      console.log('Fetched for', parent.name);
      return result;
    },
  }
};

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({ typeDefs, resolvers });

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
