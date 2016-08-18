const normalizeUrl = require("normalize-url")
const yeoman = require("yeoman-generator")
const clor = require("clor")
const yo = require("yosay")
const mkdirp = require("mkdirp")
const path = require("path")

const createDir = function (folderPath) {
  return new Promise(function (resolve, reject) {
    mkdirp(folderPath, function (err) {
      if (err) return reject(err)
      resolve()
    })
  })
}

module.exports = yeoman.generators.Base.extend({
  initializing: function() {
    this.log(yo(`Welcome to the ${clor.cyan("Fly Plugin Generator")}`))
  },

  prompting: function() {
    const done = this.async()

    this.prompt([{
      name: "githubUserName",
      message: "What is your GitHub user name?",
      store: true,
      validate: function(value) {
        return value.length > 0 ? true : "github needed"
      }
    }, {
      name: "website",
      message: "What is your website URL",
      store: true,
      default: function(props) {
        return `http://github.com/${props.githubUserName}`
      }
    }, {
      name: "pluginName",
      message: "What is your plugin name?",
      default: path.basename(process.cwd())
    }, {
      name: "description",
      message: "Add a description",
      default: function(props) {
        return `${properCase(getSlugName(props.pluginName))} plugin for Fly.`
      }
    }, {
      type: "list",
      name: "language",
      message: "Select your plugin base language",
      choices: ["ES6", "ES5"],
      default: "ES6"
    }, {
      type: "list",
      name: "testTool",
      message: "What testing tool would you like to use?",
      choices: ["jasmine", "mocha", "tape"],
      default: "tape"
    }, {
      type: "confirm",
      name: "changelog",
      message: "Do you need a CHANGELOG file?",
      store: true,
      default: true
    }, {
      type: "confirm",
      name: "gitinit",
      message: "Initialize a Git repository?",
      store: true,
      default: true
    }], function(props) {
      this.props = props
      done()
    }.bind(this))
  },

  writing: function() {
    this.pluginName = this.props.pluginName
    this.pluginSlugName = getSlugName(this.props.pluginName)
    this.pluginTitleName = properCase(this.pluginSlugName)
    this.description = this.props.description
    this.testTool = this.props.testTool
    this.language = this.props.language
    this.githubUserName = this.props.githubUserName
    this.name = this.user.git.name()
    this.email = this.user.git.email()
    this.website = normalizeUrl(this.props.website)

    const __testCmdsMapping__ = {
      tape: './node_modules/tape/bin/tape test/*.js | tap-spec',
      mocha: './node_modules/mocha/bin/mocha test',
      jasmine: './node_modules/jasmine-node/bin/jasmine-node test'
    }

    const __testBasePath__ = 'test'
    createDir(path.join(this.env.cwd, __testBasePath__))
      .then(function () {
        this.copy(
          path.join(__testBasePath__, `test-${this.testTool}.js`),
          path.join(__testBasePath__, 'test.js')
        )
      }.bind(this))

    this.testCommand = __testCmdsMapping__[this.testTool]

    this.template("_travis.yml", ".travis.yml")
    this.template("editorconfig", ".editorconfig")

    this.template(`index.${this.language.toLowerCase()}.js`, "index.js")

    this.template("README.md")
    this.template("LICENSE")
    this.template("_package.json", "package.json")
    this.template("gitignore", ".gitignore")

    if (this.props.changelog) {
      this.template("CHANGELOG.md")
    }
  },

  install: function() {
    this.installDependencies({bower: false})
  },

  end: function() {
    if (this.props.gitinit) {
      const self = this
      console.log('\n')
      this.spawnCommand("git", ["init"]).on("close", function() {
        self.spawnCommand("git", ["add", "--all"]).on("close", function() {
          self.spawnCommand('git', ["commit", "-m", "initial commit, via generator-fly 🚀"]).on("close", function() {
            console.log('\n')
          })
        })
      })
    }
  }
})

function getSlugName(pluginName) {
  return pluginName.split("-").pop()
}

function properCase(word) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}
