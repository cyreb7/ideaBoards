# Here go your api methods.

import tempfile

# Cloud-safe of uuid, so that many cloned servers do not all use the same uuids.
from gluon.utils import web2py_uuid

# Here go your api methods.

'''
insert a new deck into the database.
'''
@auth.requires_signature()
def add_deck():
    t_id = db.decks.insert(
        #add url, all other fields are set by default
        deck_name = request.vars.deck_name
    )
    return response.json(dict(
        id = t_id,
        deck_name = request.vars.deck_name,
        user_email = auth.user.email
    ))

@auth.requires_signature()
def get_decks():
    curr_decks = []
    rows = db(db.decks.created_by == auth.user_id).select()
    for r in rows:
        curr_decks.append(r)
    return response.json(curr_decks)

'''
show all cards belonging to a deck
'''
@auth.requires_signature()
def show_cards():
    curr_cards = []
    rows = db(db.cards.deck_id == request.vars.deckid).select()
    #iterate over resulting query and add all images of user to our returned image list
    for r in rows:
        curr_cards.append(r.card_image_url)
    return response.json(dict(
        cards=curr_cards,
        deck_id=request.vars.deckid,
        deck_name=db(db.decks.id == request.vars.deckid).select().first().deck_name

    ))

'''
get login status. return user first name if they are signed in
'''
def login_status():
    if auth.user is None:
        return None
    return auth.user.first_name

'''
DEBUG: delete all decks for current user
'''
@auth.requires_signature()
def delete_my_decks():
    db(db.decks.created_by == auth.user_id).delete()