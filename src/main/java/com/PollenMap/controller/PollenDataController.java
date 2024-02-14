package com.PollenMap.controller;
import com.PollenMap.service.PollenDataService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api")
public class PollenDataController {

    private final PollenDataService pollenDataService;

    public PollenDataController(PollenDataService pollenDataService) {
        this.pollenDataService = pollenDataService;
    }

    @GetMapping("/pollendata")
    public Mono<String> getPollenData() {
        return pollenDataService.fetchPollenData();
    }
}
