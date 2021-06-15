#!/usr/bin/env bash

# This script is used to run oodikone with different setups and is mainly used by
# scripts in package.json.
# Base for script: https://betterdev.blog/minimal-safe-bash-script-template/

# === Config ===

# Set up constants
PROJECT_ROOT="$(git rev-parse --show-toplevel)"

# Source common config
source "$PROJECT_ROOT"/scripts/common_config.sh

usage() {
  cat <<EOF
Usage: $(basename "${BASH_SOURCE[0]}") option [version] command --flag

Parameters:
* Option: oodikone/updater/both/morning
* Version: anon/real/ci. Not necessary in all cases.
* Command: will be passed to docker-compose.
EOF
  exit
}

# Parse parameters. If arguments are not correct, print usage and exit with error.
parse_params() {
  args=("$@")

  [[ ${#args[@]} -eq 0 ]] && usage && die "Wrong number of arguments"
  option=${args[0]}

  # If option is morning, other parameters aren't needed
  [[ "$option" == "morning" ]] && return 0

  # Else, parse arguments
  [[ ("$option" != "oodikone" && "$option" != "updater" && "$option" != "both") ]] && \
  usage && die "Wrong option"

  [[ ${#args[@]} -eq 1 ]] && usage && die "Wrong number of arguments"
  version=${args[1]}
  [[ "$version" != "anon" && "$version" != "real" && "$version" != "ci" ]] && usage && die
  # Parse all additional arguments that will be passed to docker-compose.
  compose_command=${args[*]:2}
  return 0
}

# Set which services to launch based on option
parse_services() {
  [[ "$option" == "oodikone" ]] && services="adminer analytics analytics-db backend \
frontend kone-db oodi-db redis sis-db user-db userservice"
  [[ "$option" == "updater" ]] && services="adminer redis sis-db sis-importer-db \
sis-updater-nats sis-updater-scheduler sis-updater-worker"
  return 0
}

# Set docker-compose env overrides to use for each version (anon, real or ci)
parse_env() {
  [[ "$version" == "anon" ]] && env=""
  [[ "$version" == "real" ]] && env="-f docker-compose.yml -f docker-compose.real.yml"
  [[ "$version" == "ci" ]] && env="-f docker-compose.ci.yml" && services="analytics \
analytics-db backend frontend kone-db oodi-db redis sis-db user-db userservice"
  return 0
}

# === Run script ===

parse_params "$@"

# Do morning cleanup
if [[ "$option" == "morning" ]];then
  git checkout trunk
  git pull
  docker-compose down --rmi all --remove-orphans
  return 0
fi

parse_services
parse_env

# Create command that will be run. Empty command and "down" command will be handled
# differently.
if [[ "$compose_command" == "" ]]; then
  final_command="docker-compose ${env}"
elif [[ "$compose_command" == *"down"* ]]; then
  final_command="docker-compose ${compose_command}"
else
  final_command="docker-compose ${env} ${compose_command} ${services}"
fi

msg "${BLUE}Running: ${final_command}${NOFORMAT}"
eval "$final_command"
