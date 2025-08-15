import '../config/env.js';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';

const githubClientID = process.env.GITHUB_CLIENT_ID || '';
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET || '';
const githubCallbackURL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/auth/github/callback';

if (!githubClientID || !githubClientSecret) {
  // eslint-disable-next-line no-console
  console.warn('GitHub OAuth credentials are not set. GitHub login will be disabled.');
}

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

if (githubClientID && githubClientSecret) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: githubClientID,
        clientSecret: githubClientSecret,
        callbackURL: githubCallbackURL,
        scope: ['read:user', 'user:email', 'repo'],
      },
      (accessToken, _refreshToken, profile, done) => {
        const user = {
          id: profile.id,
          username: profile.username,
          displayName: profile.displayName,
          profileUrl: profile.profileUrl,
          provider: 'github',
          accessToken,
        };
        return done(null, user);
      }
    )
  );
}

export default passport;


