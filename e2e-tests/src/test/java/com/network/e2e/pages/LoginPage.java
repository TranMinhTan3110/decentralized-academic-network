package com.network.e2e.pages;

import com.network.e2e.config.TestConfig;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class LoginPage extends BasePage {

    private final By emailInput = By.id("login-email");
    private final By passwordInput = By.id("login-password");
    private final By submitButton = By.cssSelector("button[type='submit']");

    public LoginPage(WebDriver driver) {
        super(driver);
    }

    public LoginPage open() {
        driver.get(TestConfig.BASE_URL + "/login");
        waitAndFind(emailInput);
        return this;
    }

    public LoginPage fillEmail(String email) {
        type(emailInput, email);
        return this;
    }

    public LoginPage fillPassword(String password) {
        type(passwordInput, password);
        return this;
    }

    public void submit() {
        click(submitButton);
    }

    public void login(String email, String password) {
        fillEmail(email);
        fillPassword(password);
        submit();
    }
}
