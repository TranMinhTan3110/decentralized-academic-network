package com.network.e2e.pages;

import com.network.e2e.config.TestConfig;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class RegisterPage extends BasePage {

    private final By fullNameInput = By.id("register-fullName");
    private final By usernameInput = By.id("register-username");
    private final By emailInput = By.id("register-email");
    private final By passwordInput = By.id("register-password");
    private final By majorInput = By.id("register-major");
    private final By submitButton = By.cssSelector("button[type='submit']");

    public RegisterPage(WebDriver driver) {
        super(driver);
    }

    public RegisterPage open() {
        driver.get(TestConfig.BASE_URL + "/register");
        waitAndFind(fullNameInput);
        return this;
    }

    public RegisterPage fillFullName(String fullName) {
        type(fullNameInput, fullName);
        return this;
    }

    public RegisterPage fillUsername(String username) {
        type(usernameInput, username);
        return this;
    }

    public RegisterPage fillEmail(String email) {
        type(emailInput, email);
        return this;
    }

    public RegisterPage fillPassword(String password) {
        type(passwordInput, password);
        return this;
    }

    public RegisterPage fillMajor(String major) {
        type(majorInput, major);
        return this;
    }

    public void submit() {
        click(submitButton);
    }

    public void register(String fullName, String username, String email, String password, String major) {
        fillFullName(fullName);
        fillUsername(username);
        fillEmail(email);
        fillPassword(password);
        fillMajor(major);
        submit();
    }

    public void register(String fullName, String username, String email, String password) {
        register(fullName, username, email, password, "Kỹ thuật phần mềm");
    }
}
