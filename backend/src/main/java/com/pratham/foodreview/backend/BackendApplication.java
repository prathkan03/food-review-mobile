package com.pratham.foodreview.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
public class BackendApplication {
	static {
		// Load .env file before Spring starts
		Dotenv dotenv = Dotenv.configure()
			.directory(".")
			.ignoreIfMissing()
			.load();
		
		// Set as system properties for Spring to pick up
		dotenv.entries().forEach(entry -> {
			System.setProperty(entry.getKey(), entry.getValue());
		});
	}
	
	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}
}
