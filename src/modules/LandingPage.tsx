import React from "react";

const LandingPage = () => {
  return (
    <div className="landing-page">
      <header className="hero">
        <h1>Welcome to EventSphere</h1>
        <p>Discover and join amazing events around the globe.</p>
      </header>
      <section className="featured-events">
        <h2>Featured Events</h2>
        <div className="events-list">
          {/* Replace with dynamic event data */}
          <div className="event-card">Event 1</div>
          <div className="event-card">Event 2</div>
          <div className="event-card">Event 3</div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;