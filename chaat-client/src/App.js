import React, { Component, PureComponent } from 'react';
import { Socket } from 'phoenix';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
const WEBSOCKET_URL = API_URL.replace(/(https|http)/, 'ws').replace('/api', '');
console.log(WEBSOCKET_URL)
const tokenKey = 'userToken';

function headers() {
  const token = JSON.parse(localStorage.getItem(tokenKey));

  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }
}

class MessageRow extends PureComponent {
  render() {
    return (
      <div>{this.props.message}</div>
    )
  }
}

class MessageInput extends Component {
  render() {
    return (
      <div className="MessageInput inline-block">
        <input type="text"
          ref={(el) => this.input = el}
          onKeyUp={this.emitSubmitOnEnter}
        />
      </div>
    )
  }

  emitSubmitOnEnter = (evt) => {
    if (!this.props.onSend) {
      return;
    }
    if (evt.key === "Enter") {
      this.props.onSend(evt.target.value);
      this.input.value = '';
    }
  }

}

var JoinStatus = {
  Disconnected: 'Disconnected',
  Connecting: 'Connecting',
  Connected: 'Connected',
}

class ChatSocket extends Component {
  state = {
    messages: [''],
    joinStatus: JoinStatus.Disconnected,
  }
  socket = null
  globalChannel = null

  async componentDidMount() {
    await this.joinRoom();
  }

  render() {
    const { messages, joinStatus } = this.state;
    return this.props.render({
      messages,
      joinStatus,
      sendMessage: this.sendMessage,
    });
  }

  componentWillUnmount() {
    this.joinRoomTimeout && this.clearTimeout(this.joinRoomTimeout);
  }

  sendMessage = (msg) => {
    this.globalChan.push("new:message", { body: msg });
  }

  joinRoom = () => {
    this.setState({ joinStatus: JoinStatus.Connecting });
    const token = JSON.parse(localStorage.getItem(tokenKey));
    const socket = new Socket(`${WEBSOCKET_URL}/socket`, {
      params: { token }
    });
    this.socket = socket
    socket.onOpen((e) => console.log('socket opened', e));
    socket.onClose((e) => console.log('socket closed', e));
    socket.onError((e) => console.error('socket errored', e));
    socket.connect();

    const globalChan = socket.channel('room:global', {});
    this.globalChan = globalChan;
    globalChan.join()
      .receive("ignore", () => console.log("auth error"))
      .receive("ok", () => {
        this.setState({ joinStatus: JoinStatus.Connected });
      })
      .receive("timeout", () => console.log("connection interruption"))
    globalChan.onError(e => console.error("channel errored", e))
    globalChan.onClose(e => console.log("channel closed", e))

    globalChan.on('new:message', ({ body }) => {
      this.setState({
        messages: [...this.state.messages, body]
      });
    });

  }
}

class JoinIndicator extends Component {
  render() {
    let indicatorClass;
    switch (this.props.status) {
      case JoinStatus.Disconnected:
        indicatorClass = 'inactive';
        break;
      case JoinStatus.Connected:
        indicatorClass = 'active';
        break;
      case JoinStatus.Connecting:
        indicatorClass = 'progress';
        break;
    }

    return <div className="badge">
      <div className={`badge-circle ${indicatorClass}`}>
      </div>
      <div className={`badge-pulse ${indicatorClass}`}>
      </div>
    </div>
  }
}

class JoinNotification extends Component {
  state = {
    showMessage: false,
  }
  entryTime = 200;

  render() {
    let message;
    let indicatorClass;
    switch (this.props.status) {
      case JoinStatus.Disconnected:
        message = 'disconnected 😭';
        break;
      case JoinStatus.Connected:
        message = 'welcome 🎉';
        break;
      default:
        message = null;
    }

    return <div className=""></div>
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.status !== this.props.status) {
      this.setState({ showMessage: true });
    }
  }

  hide = () => {
    this.setState({
      showMessage: false
    });
  }
}

class LoginBox extends Component {
  state = {
    newUser: false,
    email: '',
    password: '',
    new: {
      username: '',
      email: '',
      password: ''
    }
  }

  render() {
    const signInForm = (
      <form onSubmit={this.login}>
        <div>Email</div>
        <input
          type="email"
          value={this.state.email}
          onChange={this.emailInput}
        />
        <div>Password</div>
        <input
          type="password"
          value={this.state.password}
          onChange={this.passwordInput}
        />
        <div>
          <button type="submit">Sign In</button>
        </div>
      </form>
    );
    const registrationForm = (
      <form onSubmit={this.register}>
        <div>Username</div>
        <input
          type="text"
          value={this.state.new.username}
          onChange={this.newUsernameInput}
        />
        <div>Email</div>
        <input
          type="email"
          value={this.state.new.email}
          onChange={this.newEmailInput}
        />
        <div>Password</div>
        <input
          type="password"
          value={this.state.new.password}
          onChange={this.newPasswordInput}
        />
        <div>
          <button type="submit">Register</button>
        </div>
      </form>
    );
    return <div>
      {
        this.state.newUser
          ? registrationForm
          : signInForm
      }
      <button onClick={this.toggleNewUserMode}>
        {
          this.state.newUser
            ? 'Sign in to existing account'
            : 'Create a new account'
        }
      </button>
    </div>
  }

  login = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const { email, password } = this.state
    const body = JSON.stringify({ email, password });
    fetch('http://localhost:4000/api/sessions', {
      method: 'POST',
      body,
      headers: new Headers({ 'Content-Type': 'application/json' })
    })
      .then((res) => res.json())
      .then((json) => {
        localStorage.setItem(tokenKey, JSON.stringify(json.meta.token));
      });
  }

  register = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const body = JSON.stringify(this.state.new);
    fetch('http://localhost:4000/api/users', {
      method: 'POST',
      body,
      headers: new Headers({ 'Content-Type': 'application/json' })
    })
      .then((res) => res.json())
      .then((json) => {
        console.log(json)
      })
  }

  toggleNewUserMode = () => {
    this.setState({
      newUser: !this.state.newUser
    });
  }

  emailInput = (e) => {
    this.setState({
      email: e.target.value
    });
  }

  passwordInput = (e) => {
    this.setState({
      password: e.target.value
    })
  }

  newUsernameInput = (e) => {
    this.setState({
      new: {
        ...this.state.new,
        username: e.target.value
      }
    });
  }

  newEmailInput = (e) => {
    this.setState({
      new: {
        ...this.state.new,
        email: e.target.value
      }
    });
  }

  newPasswordInput = (e) => {
    this.setState({
      new: {
        ...this.state.new,
        password: e.target.value
      }
    });
  }
}

class App extends Component {
  render() {
    return (
      <div className="App">
        <ChatSocket
          render={({ messages, sendMessage, joinStatus }) => {
            return <div>
              {messages.map((msg) => <MessageRow key={msg} message={msg}/>)}
              <JoinIndicator status={joinStatus}/>
              <MessageInput onSend={sendMessage}/>
            </div>
          }}
        />
        <LoginBox/>
      </div>
    );
  }
}

export default App;
