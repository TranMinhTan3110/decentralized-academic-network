package com.network.e2e.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

import java.util.List;

public class VerifyOtpPage extends BasePage {

    private final By otpInputs = By.cssSelector("input[inputmode='numeric']");
    private final By submitButton = By.cssSelector("button[type='submit']");

    public VerifyOtpPage(WebDriver driver) {
        super(driver);
    }

    public VerifyOtpPage enterOtp(String code) {
        wait.until(d -> d.findElements(otpInputs).size() == 6);
        List<WebElement> inputs = driver.findElements(otpInputs);
        for (int i = 0; i < Math.min(inputs.size(), code.length()); i++) {
            inputs.get(i).sendKeys(String.valueOf(code.charAt(i)));
        }
        return this;
    }

    public void submit() {
        click(submitButton);
    }

    public void verify(String code) {
        enterOtp(code);
        submit();
    }
}
