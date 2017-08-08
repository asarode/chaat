# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.
use Mix.Config

# General application configuration
config :chaat,
  ecto_repos: [Chaat.Repo]

# Configures the endpoint
config :chaat, Chaat.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "xBDouC0/cvAFXnzPrHVOoeKfBkkTMrh0i3rxi7yLAOi2hniehxMYmmWQFWa8Yv5K",
  render_errors: [view: Chaat.ErrorView, accepts: ~w(json)],
  pubsub: [name: Chaat.PubSub,
           adapter: Phoenix.PubSub.PG2]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

config :guardian, Guardian,
  issuer: "Chaat",
  ttl: {30, :days},
  verify_issuer: true,
  serializer: Chaat.GuardianSerializer

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env}.exs"