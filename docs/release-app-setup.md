# One-time GitHub App setup for Cipher releases

This setup lets Cipher publish review branches, author draft PRs and start a
release as a GitHub App installation. `tullyelly` remains the human reviewer and
deployment approver. Setup and the harmless approval test are complete: parent
[38175631646](https://github.com/tullyelly/tullyelly.com/actions/runs/38175631646)
and child [38175750484](https://github.com/tullyelly/tullyelly.com/actions/runs/38175750484)
succeeded, with `tullyelly` approving the child gate. Vercel Git was disconnected
through a separately approved settings operation. No actual production release
or database migration has been authorized by that test. The checklist below is
retained for maintenance and recovery, not an instruction to duplicate setup.

## Numbered account checklist

1. **Create the App under your `tullyelly` account.** Open your profile menu >
   Settings > Developer settings > GitHub Apps > New GitHub App. Use the fields
   below. The suggested name must be globally available; if unavailable, choose
   another short name and use its actual slug in configuration.

   | Field                                          | Value                                                                                                  |
   | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
   | GitHub App name                                | Cipher tullyelly releases                                                                              |
   | Description                                    | Repository-scoped installation automation for reviewed release branches and approved workflow dispatch |
   | Homepage URL                                   | https://github.com/tullyelly/tullyelly.com                                                             |
   | Callback URL                                   | Leave blank                                                                                            |
   | Expire user authorization tokens               | Leave the default enabled; user tokens are not used                                                    |
   | Request user authorization during installation | Unchecked                                                                                              |
   | Enable Device Flow                             | Unchecked                                                                                              |
   | Setup URL                                      | Leave blank                                                                                            |
   | Redirect on update                             | Unchecked                                                                                              |
   | Webhook Active                                 | Unchecked                                                                                              |
   | Webhook URL and secret                         | Leave blank                                                                                            |
   | Subscribe to events                            | None                                                                                                   |
   | Where can this App be installed?               | Only on this account                                                                                   |

2. **Set only the repository permissions needed for this integration.** Leave
   organization and account permissions at No access. The App never approves
   reviews, merges PRs or approves deployment gates.

   | Repository permission                                          | Registration setting              | Why                                                            |
   | -------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------- |
   | Metadata                                                       | Read-only; automatically required | Confirm the exact repository and installation                  |
   | Actions                                                        | Read and write                    | Dispatch the child workflow as the App                         |
   | Contents                                                       | Read and write                    | Publish the review branch as the App; inspect its exact commit |
   | Pull requests                                                  | Read and write                    | Create/update an App-authored draft PR                         |
   | Workflows                                                      | Read and write                    | Publish the workflow files in this feature branch              |
   | All others, including Administration, Environments and Secrets | No access                         | No account configuration or approval authority needed          |

   Registration is the maximum capability. Each short-lived token is narrower:
   dispatch receives Actions write only; PR creation receives Contents read plus
   Pull requests write; publishing receives Contents/Workflows write. Tokens are
   restricted to repository ID `1038458067` and revoked after use. Dispatch-only
   installations can omit Contents write, Workflows write and PR write, but that
   would not satisfy this project's App-authored branch/PR workflow.

3. **Install only on `tullyelly/tullyelly.com`.** Click Create GitHub App, then
   Install App > your `tullyelly` account > Only select repositories >
   `tullyelly.com`. Do not choose All repositories. Record the numeric App ID
   from its General page, actual slug from the App URL, and installation ID from
   the installation Configure URL. App ID, client ID, installation ID and bot
   user ID are different values; do not substitute one for another.

4. **Record non-secret configuration in repository Actions variables.** Open
   `tullyelly/tullyelly.com` > Settings > Secrets and variables > Actions >
   Variables. Add the exact names below. These IDs are safe to share; private
   keys and installation tokens are not.

   | Variable                    | Exact value to use                                                  |
   | --------------------------- | ------------------------------------------------------------------- |
   | RELEASE_APP_ID              | Numeric App ID from General                                         |
   | RELEASE_APP_INSTALLATION_ID | Numeric ID of this repository-only installation                     |
   | RELEASE_APP_SLUG            | Actual App slug, without `[bot]`                                    |
   | RELEASE_APP_BOT_USER_ID     | Numeric `id` for `<actual-slug>[bot]` from GitHub's public user API |

   To obtain the bot ID, open
   `https://api.github.com/users/<actual-slug>%5Bbot%5D` in your browser after
   installation. Confirm `login` is the App slug followed by `[bot]` and `type`
   is `Bot`; copy only its numeric `id`. Never use `12563331`, which belongs to
   the human `tullyelly` account. Cipher will independently verify all identities.

5. **Store the App private key outside the production gate.** In repository
   Settings > Environments, create `release-dispatch`. Allow only the custom
   deployment branch `main`; no tags or wildcards. Disable administrator bypass
   (uncheck Allow administrators to bypass configured protection rules).
   Do not add required reviewers
   to this environment: it initiates the child run that requests approval.
   Protected/reviewed main and the narrowly scoped dispatcher protect this key.
   In the App's General page, choose Generate a private key. In
   `release-dispatch` > Environment secrets, create `RELEASE_APP_PRIVATE_KEY`
   and paste the complete PEM only in GitHub's secret form. Do not generate a
   client secret or use OAuth/user authentication. Do not put this private key
   in Vercel, a repository-wide secret, the production environment or chat.

6. **Prepare the secure local bootstrap copy.** The first reviewed branch is
   still local, so Cipher needs installation authentication to publish it as the
   App. Store the downloaded PEM at
   `/home/giannis/.config/cipher-release/tullyelly-release-app.pem`. Its parent
   directory must be mode 0700 and the file mode 0600. In a WSL Bash terminal,
   use the following permissions commands after copying the file there through
   your file manager; do not put its contents in a shell command:

   ```bash
   install -d -m 700 /home/giannis/.config/cipher-release
   chmod 600 /home/giannis/.config/cipher-release/tullyelly-release-app.pem
   ```

   Populate ignored `.env.release-dispatch.local` locally with only the four
   metadata variable names from step 4 and:

   ```dotenv
   RELEASE_APP_PRIVATE_KEY_PATH=/home/giannis/.config/cipher-release/tullyelly-release-app.pem
   ```

   Set that environment file to mode 0600. The PEM stays outside the repository;
   it is never committed or copied into a deployment artifact. The local publisher
   reads it only to mint a repository-scoped installation token, uses temporary
   process environment authentication and does not replace the SSH remote,
   credential helper, npm or VS Code settings. Remove the local copy once no
   longer needed; retain the GitHub environment secret for routine dispatch.

7. **Keep the human approval gate separate.** Create/configure
   `production-release` according to [the release policy](production-releases.md):
   required reviewer `tullyelly`, Prevent self-review enabled, administrator
   bypass disabled, only branch `main`. Production database, Neon and Vercel
   credentials belong only there. Do not copy the App private key there; doing
   so would require approval before Cipher could request approval. The App is
   not a reviewer and must not be granted bypass access.

8. **Protect PR review before workflow bootstrap.** Configure fresh code owner
   review and the strict `Lint, test, build` status check on main as described in
   the release policy. The checked-in CODEOWNERS names `tullyelly` for release
   code. Deployment approval is a separate action from approving a PR. Because
   main requires approval of the latest push by another identity, Cipher must
   both push the reviewable branch and author its draft PR as the App. A human
   push followed by an App-authored PR does not solve the last-pusher rule.

9. **Wait for Cipher's bootstrap handoff.** GitHub dispatchable workflows must
   be present on the default branch before the test can run. Current Vercel Git
   automation deploys main on merge; do not merge this branch during setup.
   Cipher must first present the separate reviewed change to disconnect that
   automatic deployment path. Account setup is not permission to perform the
   change, merge, migrate or deploy. No workflow is dispatched during setup.

10. **Run the harmless gate proof after approved bootstrap.** Cipher starts
    the App dispatcher in `smoke` mode. It verifies installation scope and
    mints an Actions-only token. The child workflow must show the App's bot
    login/ID as actor and triggering actor, then wait at `production-release`.
    As `tullyelly`, open that **gate smoke** run > Review deployments > select
    `production-release` > Approve and deploy. Despite GitHub's button wording,
    this test does not deploy: it references no production credentials and runs
    no database, Vercel or migration command. Cipher verifies the completed
    run and approval evidence. Stop if the actor is tullyelly, the gate is skipped,
    you cannot approve, or any production command appears. A production release
    still needs a separate concrete plan and approval after this harmless test.

## What is verified and what remains pending

Installation authentication and its identity are checked in code and fixtures;
the App now exists and local installation authentication/scope were verified
on 2026-10-11. Workflow actor attribution, pending approval and human approval
have not yet been demonstrated. Installing/configuring an App is not
proof that it works. Use the harmless test before trusting the production gate.

Cipher does not use a user access token acting as tullyelly and does not expose
installation tokens in Git remote URLs, CLI arguments, output or artifacts.
Errors omit key/token/API bodies. The account owner rotates the App private key
in both secure locations, deletes superseded keys in GitHub, and can suspend the
installation to disable dispatch. This does not delete archived analytics.

Official sources: [App registration](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app),
[installation authentication](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation),
and [protected branch review rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

The completed account audit and exact initial PR/bootstrap sequence are in
[the separate Vercel/bootstrap proposal](vercel-bootstrap-change.md). Follow
that current record instead of repeating account registration.
