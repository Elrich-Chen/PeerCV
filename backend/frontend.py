import requests
import streamlit as st

DEFAULT_API_URL = "http://localhost:8000"

st.set_page_config(page_title="Commenting Feature", layout="centered")

st.markdown(
    """
    <style>
    .post-card {
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        padding: 16px;
        margin-bottom: 18px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .post-title {
        font-weight: 600;
        margin-bottom: 6px;
    }
    .post-id {
        font-size: 12px;
        color: #6b7280;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

st.title("Commenting Feature")
st.caption("Create a post, then open comments to add or read replies.")

if "api_url" not in st.session_state:
    st.session_state.api_url = DEFAULT_API_URL
if "posts" not in st.session_state:
    st.session_state.posts = []
if "comments_by_post" not in st.session_state:
    st.session_state.comments_by_post = {}
if "posts_loaded" not in st.session_state:
    st.session_state.posts_loaded = False


def short_id(value: str) -> str:
    return value[-8:] if len(value) > 8 else value


def load_posts(base_url: str) -> list[dict]:
    response = requests.get(f"{base_url}/posts", timeout=5)
    response.raise_for_status()
    return response.json()


def load_comments(base_url: str, post_id: str) -> list[dict]:
    response = requests.get(f"{base_url}/comments/{post_id}", timeout=5)
    response.raise_for_status()
    return response.json()


with st.sidebar:
    st.header("Controls")
    api_url = st.text_input("API base URL", value=st.session_state.api_url).strip()
    if api_url != st.session_state.api_url:
        st.session_state.api_url = api_url
        st.session_state.posts = []
        st.session_state.comments_by_post = {}
        st.session_state.posts_loaded = False

    refresh_clicked = st.button("Refresh feed")
    create_clicked = st.button("Create post")

create_success = False
if create_clicked:
    try:
        response = requests.post(f"{api_url}/posts/upload", timeout=5)
        response.raise_for_status()
        create_success = True
        st.success("Post created.")
    except requests.RequestException as exc:
        st.error(f"Failed to create post: {exc}")

if refresh_clicked or create_success or not st.session_state.posts_loaded:
    try:
        st.session_state.posts = load_posts(api_url)
        st.session_state.posts_loaded = True
    except requests.RequestException as exc:
        st.error(f"Failed to load posts: {exc}")
        st.session_state.posts_loaded = False

if st.session_state.posts_loaded:
    st.caption(f"{len(st.session_state.posts)} post(s) in feed")

st.subheader("Feed")

if not st.session_state.posts:
    st.info("No posts yet. Click Create post in the sidebar to add one.")
else:
    for post in st.session_state.posts:
        post_id = str(post.get("post_id", "")).strip()
        if not post_id:
            continue

        st.markdown(
            f"""
            <div class="post-card">
                <div class="post-title">Post {short_id(post_id)}</div>
                <div class="post-id">{post_id}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        col_left, col_right = st.columns([1, 2])

        with col_left:
            if st.button("Comments +", key=f"load_{post_id}"):
                try:
                    st.session_state.comments_by_post[post_id] = load_comments(
                        api_url, post_id
                    )
                except requests.RequestException as exc:
                    st.error(f"Failed to load comments: {exc}")

        with col_right:
            with st.expander("Add comment"):
                with st.form(key=f"comment_form_{post_id}"):
                    author = st.text_input("Author (optional)", key=f"author_{post_id}")
                    body = st.text_area("Comment", key=f"body_{post_id}")
                    submitted = st.form_submit_button("Submit comment")

                if submitted:
                    if not body.strip():
                        st.warning("Comment body is required.")
                    else:
                        try:
                            payload = {
                                "post_id": post_id,
                                "author": author.strip() or None,
                                "body": body.strip(),
                            }
                            response = requests.post(
                                f"{api_url}/comments/{post_id}",
                                json=payload,
                                timeout=5,
                            )
                            response.raise_for_status()
                            st.session_state.comments_by_post[post_id] = load_comments(
                                api_url, post_id
                            )
                            st.success("Comment created.")
                        except requests.RequestException as exc:
                            st.error(f"Failed to create comment: {exc}")

        comments = st.session_state.comments_by_post.get(post_id)
        if comments is not None:
            if comments:
                st.markdown("Comments:")
                for comment in comments:
                    author_display = comment.get("author") or "Anonymous"
                    body = comment.get("body", "")
                    st.markdown(f"- {author_display}: {body}")
            else:
                st.caption("No comments yet.")
