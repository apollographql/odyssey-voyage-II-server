import "claims" as claims_process;

fn process_request(request) {
  claims_process::process_request(request)
}

fn subgraph_service(service, subgraph) {
  
  let response_callback = |response| {
      print(`Subgraph service: Received sub-operation response from subgraph ${subgraph}`);
  };

    const request_callback = Fn("process_request"); 


  service.map_request(request_callback);
  service.map_response(response_callback);
}