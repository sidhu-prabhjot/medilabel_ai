Getting Started:

create a venv in backend directory and start it using:
`.\backend\venv-name\Scripts\activate`

example: `.\backend\medical-ai-venv\Scripts\activate`

boot up the backend api locally using:
`uvicorn backend.api.main:app --reload`

authorize to use the api for dev by:

1. Finding auth_provider_user_id for the user in the users table
2. Clicking the auth button on the swagger ui
3. entering the user id
   (Now you are authorized for that session)
