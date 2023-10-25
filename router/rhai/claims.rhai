fn process_request(request) {
    print("Supergraph service: Client request received");

    let claims = request.context[Router.APOLLO_AUTHENTICATION_JWT_CLAIMS];
    if claims ==() {
      throw #{
        status: 401
      };
    }
    print(claims);
    let claim_names = ["userId", "userRole", "somethingToTest"];
    for claim_name in claim_names {
      let claim = claims[claim_name];
      claim = if claim == () {""} else {claim};
      request.subgraph.headers[claim_name] = claim;
    }
}
