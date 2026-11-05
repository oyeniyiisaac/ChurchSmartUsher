"use client";

import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

export function createApolloClient() {
  return new ApolloClient({
    link: new HttpLink({ uri: "/api/graphql", credentials: "include" }),
    cache: new InMemoryCache(),
  });
}
