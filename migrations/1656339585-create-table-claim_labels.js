exports.up = async (sql) => {
  await sql`
    CREATE TABLE claim_labels (
      id integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
			claim_id integer REFERENCES claims (id) ON DELETE CASCADE,
			label_id integer REFERENCES labels (id) ON DELETE CASCADE
    )
  `;
};

exports.down = async (sql) => {
  await sql`
    DROP TABLE claim_labels
  `;
};
