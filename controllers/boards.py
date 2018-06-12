# -*- coding: utf-8 -*-
# this file is released under public domain and you can use without limitations

# -------------------------------------------------------------------------
# This is a sample controller
# - index is the default action of any application
# - user is required for authentication and authorization
# - download is for downloading files uploaded in the db (does streaming)
# -------------------------------------------------------------------------


def index():
    """
    example action using the internationalization operator T and flash
    rendered by views/default/index.html or views/generic.html

    if you need a simple wiki simply replace the two lines below with:
    return auth.wiki()
    """
    # response.flash = T("Hello World")
    return dict(message=T('Welcome to web2py!'))

'''
get all boards that belong to the signed in user
'''
@auth.requires_signature()
def get_boards():
    curr_boards = []
    rows = db(db.boards.created_by == auth.user_id).select()
    for r in rows:
        curr_boards.append(r)
    return response.json(curr_boards)

'''
insert a new board into the database.
'''
@auth.requires_signature()
def add_board():
    t_id = db.boards.insert(
        board_name = request.vars.board_name
    )
    entry = db(db.boards.id == t_id).select().first()
    return response.json(entry)

'''
remove the board with the given board_id from the db
'''
@auth.requires_signature()
def delete_board():
    db(db.boards.id == request.vars.board_id).delete()

'''
save the contents of the board
'''
@auth.requires_signature()
def save_board():
    board_id = int(request.vars.board_id)
    entry = db(db.boards.id == board_id).select().first()
    entry.update_record(board_content=request.vars.board_state)
    return response.json(request.vars.board_state)

'''
get the contents of a board
'''
@auth.requires_signature()
def get_board_content():
    row = db(request.vars.board_id == db.boards.id).select().first()
    return response.json(row.board_content)