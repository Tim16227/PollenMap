package com.PollenMap.service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class PollenDataService {

    private final WebClient webClient;

    public PollenDataService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("https://opendata.dwd.de/climate_environment/health/alerts").build();
    }

    public Mono<String> fetchPollenData() {

        return this.webClient.get().uri("/s31fg.json")
                .retrieve()
                .bodyToMono(String.class);
    }
}

