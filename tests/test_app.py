import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data

def test_signup_and_unregister():
    # Utiliser une activité de test
    activity = "Chess Club"
    email = "testuser@mergington.edu"
    # S'inscrire
    response = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert response.status_code == 200
    # Vérifier que l'utilisateur est inscrit
    response = client.get("/activities")
    participants = response.json()[activity]["participants"]
    assert email in participants
    # Désinscrire
    response = client.post(f"/activities/{activity}/unregister", params={"email": email})
    assert response.status_code == 200
    # Vérifier que l'utilisateur n'est plus inscrit
    response = client.get("/activities")
    participants = response.json()[activity]["participants"]
    assert email not in participants

def test_signup_duplicate():
    activity = "Chess Club"
    email = "duplicate@mergington.edu"
    # S'inscrire une première fois
    client.post(f"/activities/{activity}/signup", params={"email": email})
    # S'inscrire une deuxième fois (doit échouer)
    response = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert response.status_code == 400
    # Nettoyer
    client.post(f"/activities/{activity}/unregister", params={"email": email})

def test_unregister_not_found():
    activity = "Chess Club"
    email = "notfound@mergington.edu"
    response = client.post(f"/activities/{activity}/unregister", params={"email": email})
    assert response.status_code == 404
