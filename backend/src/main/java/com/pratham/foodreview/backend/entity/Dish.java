package com.pratham.foodreview.backend.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import org.hibernate.annotations.Type;

import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.List;

@Entity
@Table(name = "dishes", schema = "public",
    uniqueConstraints = @UniqueConstraint(columnNames = {"restaurant_id", "dish_name"}))
public class Dish {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;

    @Column(name = "dish_name")
    private String dishName;

    @Column(name = "created_at")
    private OffsetDateTime created_at;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> ingredients; 

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> steps;

    public UUID getId() { return id; }
    public void setId( UUID id ) { this.id = id;}

    public Restaurant getRestaurant() { return restaurant;}
    public void setRestaurant(Restaurant restaurant) { this.restaurant = restaurant;}

    public String getDishName() { return dishName;}
    public void setDishName(String dishName) { this.dishName = dishName;}

    public OffsetDateTime getCreatedAt() { return created_at; }
    public void setCreatedAt(OffsetDateTime created_at) { this.created_at = created_at;}

    public List<String> getIngredients() { return ingredients;}
    public void setIngredients(List<String> ingredients) { this.ingredients = ingredients;}

    public List<String> getSteps() { return steps; }
    public void setSteps(List<String> steps) { this.steps = steps;}
}
