package com.PollenMap.controller;

import jakarta.faces.view.ViewScoped;
import org.springframework.stereotype.Component;

@Component
@ViewScoped
public class TestController {

    public static String getTestMessage() {
        return "Diese Test Nachricht kommt via jsf aus dem Backend!";
    }

}
