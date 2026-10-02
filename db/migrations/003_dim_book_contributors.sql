-- 003 · dim_book / bridge_book_author: los libros editados o coordinados no tienen rol "author";
-- se consideran responsables principales author, editor y coordinator.
CREATE OR REPLACE VIEW analytics.dim_book AS
SELECT b.id AS book_key,
       b.isbn,
       b.title,
       b.slug,
       (SELECT string_agg(a.name, ', ' ORDER BY ba.position)
          FROM book_authors ba JOIN authors a ON a.id = ba.author_id
         WHERE ba.book_id = b.id AND ba.role IN ('author', 'editor', 'coordinator')) AS authors,
       pub.name AS publisher_name,
       col.name AS collection_name,
       b.series,
       (SELECT string_agg(c.name, ', ' ORDER BY c.name)
          FROM book_categories bc JOIN categories c ON c.id = bc.category_id
         WHERE bc.book_id = b.id) AS categories,
       b.format,
       b.language,
       b.publication_year,
       b.pages,
       b.price AS list_price,
       b.status
FROM books b
LEFT JOIN publishers pub ON pub.id = b.publisher_id
LEFT JOIN collections col ON col.id = b.collection_id;

CREATE OR REPLACE VIEW analytics.bridge_book_author AS
SELECT ba.book_id AS book_key, ba.author_id AS author_key, ba.role,
       1.0 / count(*) OVER (PARTITION BY ba.book_id) AS allocation_factor
FROM book_authors ba
WHERE ba.role IN ('author', 'editor', 'coordinator');
