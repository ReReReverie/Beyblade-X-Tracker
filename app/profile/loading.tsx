export default function ProfileLoading() {
  return (
    <div className="list">
      <section className="band">
        <span className="tag tag--filled">Profile</span>
        <div className="profile-head">
          <div className="profile-avatar" aria-hidden="true" />
          <div>
            <h1>Loading profile...</h1>
            <p className="meta">Preparing your profile.</p>
          </div>
        </div>
      </section>
      <nav className="dashboard-tabs" aria-label="Profile sections">
        {["Overview", "Posts", "Starred", "Lineup", "Career"].map((label) => (
          <button className="button secondary dashboard-tab" type="button" disabled key={label}>
            {label}
          </button>
        ))}
      </nav>
      <p className="meta">Loading...</p>
    </div>
  );
}
