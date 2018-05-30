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
    return "done"

'''
show all cards belonging to a deck
'''
@auth.requires_signature()
def show_images():
    curr_cards = []
    rows = db(db.cards.deck_name == request.vars.deck_name).select()
    #iterate over resulting query and add all images of user to our returned image list
    for r in rows:
        curr_cards.append(r.card_image_url)
    return response.json(curr_images)

'''
get login status. return user first name if they are signed in
'''
def login_status():
    if auth.user is None:
        return None
    return auth.user.first_name