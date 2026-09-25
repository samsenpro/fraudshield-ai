package com.fraudshield;

import org.springframework.boot.SpringApplication;

public class TestFraudshieldApiApplication {

	public static void main(String[] args) {
		SpringApplication.from(FraudshieldApiApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
