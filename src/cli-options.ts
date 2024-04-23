const re = /^toml_env_config_(encoding|path|debug|override|TOML_ENV_KEY)=(.+)$/;

export default function optionMatcher(args: string[]) {
  return args.reduce(function (acc, cur) {
    const matches = cur.match(re);
    if (matches) {
      acc[matches[1]] = matches[2];
    }
    return acc;
  }, {});
}
