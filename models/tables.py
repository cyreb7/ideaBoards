# Define your tables below (or better in another model file) for example
#
# >>> db.define_table('mytable', Field('myfield', 'string'))
#
# Fields can be 'string','text','password','integer','double','boolean'
#       'date','time','datetime','blob','upload', 'reference TABLENAME'
# There is an implicit 'id integer autoincrement' field
# Consult manual for more options, validators, etc.

#define db table for decks
db.define_table('decks',
                Field('deck_name'),
                Field('created_on', 'datetime', default=request.now),
                Field('created_by', 'reference auth_user', default=auth.user_id)
                )

#define db table for cards
db.define_table('cards',
                Field('created_on', 'datetime', default=request.now),
                Field('created_by', 'reference auth_user', default=auth.user_id),
                Field('deck_name'),
                Field('deck_id'),
                Field('card_image_url'),
                Field('caption')
                )

db.define_table('boards',
                Field('created_on', 'datetime', default=request.now),
                Field('created_by', 'reference auth_user', default=auth.user_id),
                Field('board_name'),
                Field('board_content', 'text', default='')
                )
# after defining tables, uncomment below to enable auditing
# auth.enable_record_versioning(db)
