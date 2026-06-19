def test_list_wiki_articles_public(client):
    response = client.get("/api/v1/learn/wiki/articles")
    assert response.status_code == 200
    articles = response.json()
    assert len(articles) >= 4
    assert articles[0]["order"] <= articles[1]["order"]
    assert "title" in articles[0]
    assert "summary" in articles[0]


def test_get_wiki_article_public(client):
    response = client.get("/api/v1/learn/wiki/articles/about-learn")
    assert response.status_code == 200
    article = response.json()
    assert "Learn Portal" in article["title"]
    assert article["body_html"]
    assert "/content/" in article["body_html"]
    assert article["tags"] == ["Learn"]


def test_get_wiki_article_not_found(client):
    response = client.get("/api/v1/learn/wiki/articles/missing-article")
    assert response.status_code == 404


def test_student_forbidden_on_author_wiki_api(client, student_headers):
    response = client.post(
        "/api/v1/learn/author/wiki/articles",
        headers=student_headers,
        json={"title": "Тест", "summary": "Описание"},
    )
    assert response.status_code == 403


def test_author_wiki_crud(client, author_headers):

    create = client.post(
        "/api/v1/learn/author/wiki/articles",
        headers=author_headers,
        json={
            "id": "wiki-test-article",
            "title": "Тестовая статья",
            "summary": "Краткое описание",
            "body_html": "<p>Текст статьи</p>",
            "tags": ["#Тест", "Wiki"],
        },
    )
    assert create.status_code == 201
    article_id = create.json()["id"]
    assert article_id == "wiki-test-article"
    assert create.json()["tags"] == ["Тест", "Wiki"]

    public = client.get(f"/api/v1/learn/wiki/articles/{article_id}")
    assert public.status_code == 200
    assert public.json()["title"] == "Тестовая статья"

    update = client.put(
        f"/api/v1/learn/author/wiki/articles/{article_id}",
        headers=author_headers,
        json={
            "title": "Обновлённая статья",
            "summary": "Новое описание",
            "body_html": "<p>Новый текст</p>",
            "tags": ["Wiki"],
        },
    )
    assert update.status_code == 200
    assert update.json()["title"] == "Обновлённая статья"
    assert update.json()["tags"] == ["Wiki"]

    delete = client.delete(
        f"/api/v1/learn/author/wiki/articles/{article_id}",
        headers=author_headers,
    )
    assert delete.status_code == 204

    gone = client.get(f"/api/v1/learn/wiki/articles/{article_id}")
    assert gone.status_code == 404


def test_author_wiki_image_upload(client, author_headers, student_headers):

    png_bytes = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01"
        b"\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82"
    )

    response = client.post(
        "/api/v1/learn/author/wiki/upload",
        headers=author_headers,
        files={"file": ("test.png", png_bytes, "image/png")},
    )
    assert response.status_code == 200
    image_path = response.json()["image_path"]
    assert image_path.startswith("/content/wiki/")
    assert image_path.endswith(".png")

    forbidden = client.post(
        "/api/v1/learn/author/wiki/upload",
        headers=student_headers,
        files={"file": ("test.png", png_bytes, "image/png")},
    )
    assert forbidden.status_code == 403
