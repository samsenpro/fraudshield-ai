package com.fraudshield;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.fraudshield.config.FlywayMigration;

@SpringBootApplication
public class FraudshieldApiApplication {

	public static void main(String[] args) {
		FlywayMigration.run();
		SpringApplication.run(FraudshieldApiApplication.class, args);
	}

}
