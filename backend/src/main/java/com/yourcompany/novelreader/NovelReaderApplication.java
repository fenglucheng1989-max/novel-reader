package com.yourcompany.novelreader;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.yourcompany.novelreader.mapper")
public class NovelReaderApplication {

    public static void main(String[] args) {
        SpringApplication.run(NovelReaderApplication.class, args);
    }

}
