import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {openLoadingProject, closeLoadingProject} from 'scratch-gui/src/reducers/modals';
import {
  requestProjectUpload,
  setProjectId,
  defaultProjectId,
  onFetchedProjectData,
  onLoadedProject,
  requestNewProject
} from 'scratch-gui/src/reducers/project-state';
import {setFileHandle} from 'scratch-gui/src/reducers/tw';

let mountedOnce = false;

const DesktopHOC = function (WrappedComponent) {
  class DesktopComponent extends React.Component {
    constructor (props) {
      super(props);
      this.state = {
        title: null
      };
      // this.handleExportProjectOverIPC = this.handleExportProjectOverIPC.bind(this);
      // this.handleLoadExtensionOverIPC = this.handleLoadExtensionOverIPC.bind(this);
      // localeChanged(this.props.locale);
    }
    componentDidMount () {
      // ipcRenderer.on('export-project/start', this.handleExportProjectOverIPC);
      // ipcRenderer.on('load-extension/start', this.handleLoadExtensionOverIPC);

      // This component is re-mounted when the locale changes, but we only want to load
      // the initial project once.
      if (mountedOnce) {
        return;
      }
      mountedOnce = true;

      this.props.onLoadingStarted();
      (async () => {
        const hasFile = await EditorPreload.hasInitialFile();
        if (!hasFile) {
          this.props.onHasInitialProject(false, this.props.loadingState);
          this.props.onLoadingCompleted();
          return;
        }
 
        this.props.onHasInitialProject(true, this.props.loadingState);
        const file = await EditorPreload.getInitialFile();

        const {name, data} = file;
        await this.props.vm.loadProject(data);
        this.props.onLoadingCompleted();
        this.props.onLoadedProject(this.props.loadingState, true);

        this.setState({
          title: name
        });
        // TODO: set file handle
      })().catch(error => {
        console.error(error);
        alert(error);

        this.props.onLoadingCompleted();
        this.props.onLoadedProject(this.props.loadingState, false);
        this.props.onHasInitialProject(false, this.props.loadingState);
        this.props.onRequestNewProject();
      });
    }
    componentDidUpdate (prevProps) {
      if (this.props.projectChanged !== prevProps.projectChanged) {
        EditorPreload.setChanged(this.props.projectChanged);
      }

      if (!this.props.fileHandle && prevProps.fileHandle) {
        EditorPreload.closedFile();
      }
    }
    componentWillUnmount () {
      // ipcRenderer.removeListener('export-project/start', this.handleExportProjectOverIPC);
      // ipcRenderer.removeListener('load-extension/start', this.handleLoadExtensionOverIPC);
    }
    async handleExportProjectOverIPC (event) {
      // ipcRenderer.sendTo(event.senderId, 'export-project/ack');
      // try {
      //   const arrayBuffer = await this.props.vm.saveProjectSb3('arraybuffer');
      //   ipcRenderer.sendTo(event.senderId, 'export-project/done', {
      //     data: arrayBuffer,
      //     name: document.title
      //   });
      // } catch (e) {
      //   console.error(e);
      //   ipcRenderer.sendTo(event.senderId, 'export-project/error', '' + e);
      // }
    }
    handleLoadExtensionOverIPC (event, url) {
      // this.props.vm.extensionManager.loadExtensionURL(url)
      //   .then(() => {
      //     ipcRenderer.sendTo(event.senderId, 'load-extension/done');
      //   })
      //   .catch((error) => {
      //     console.error(error);
      //     ipcRenderer.sendTo(event.senderId, 'load-extension/error', error);
      //   });
    }
    render() {
      const {
        locale,
        loadingState,
        projectChanged,
        onFetchedInitialProjectData,
        onHasInitialProject,
        onLoadedProject,
        onLoadingCompleted,
        onLoadingStarted,
        onRequestNewProject,
        onSetFileHandle,
        vm,
        ...props
      } = this.props;
      return (
        <WrappedComponent
          // projectTitle={this.state.title}
          // onClickAddonSettings={openAddonSettings}
          // onClickNewWindow={[
          //   getTranslation('menu.new-window'),
          //   openNewWindow
          // ]}
          // onClickAbout={[
          //   {
          //     title: getTranslation('desktop-settings'),
          //     onClick: onDesktopSettings
          //   },
          //   {
          //     title: getTranslation('privacy'),
          //     onClick: openPrivacyPolicy
          //   },
          //   {
          //     title: getTranslation('about'),
          //     onClick: openAbout
          //   },
          //   {
          //     title: getTranslation('source'),
          //     onClick: openSourceCode
          //   },
          //   {
          //     title: getTranslation('donate'),
          //     onClick: openDonate
          //   }
          // ]}
          {...props}
        />
      );
    }
  }

  DesktopComponent.propTypes = {
    locale: PropTypes.string.isRequired,
    loadingState: PropTypes.string.isRequired,
    projectChanged: PropTypes.bool.isRequired,
    onFetchedInitialProjectData: PropTypes.func.isRequired,
    onHasInitialProject: PropTypes.func.isRequired,
    onLoadedProject: PropTypes.func.isRequired,
    onLoadingCompleted: PropTypes.func.isRequired,
    onLoadingStarted: PropTypes.func.isRequired,
    onRequestNewProject: PropTypes.func.isRequired,
    onSetFileHandle: PropTypes.func.isRequired,
    vm: PropTypes.shape({
      loadProject: PropTypes.func.isRequired
    }).isRequired
  };

  const mapStateToProps = state => ({
    locale: state.locales.locale,
    loadingState: state.scratchGui.projectState.loadingState,
    projectChanged: state.scratchGui.projectChanged,
    vm: state.scratchGui.vm
  });

  const mapDispatchToProps = dispatch => ({
    onLoadingStarted: () => dispatch(openLoadingProject()),
    onLoadingCompleted: () => dispatch(closeLoadingProject()),
    onHasInitialProject: (hasInitialProject, loadingState) => {
      if (hasInitialProject) {
        return dispatch(requestProjectUpload(loadingState));
      }
      return dispatch(setProjectId(defaultProjectId));
    },
    onFetchedInitialProjectData: (projectData, loadingState) => dispatch(onFetchedProjectData(projectData, loadingState)),
    onLoadedProject: (loadingState, loadSuccess) => {
      return dispatch(onLoadedProject(loadingState, /* canSave */ false, loadSuccess));
    },
    onRequestNewProject: () => dispatch(requestNewProject(false)),
    onSetFileHandle: fileHandle => dispatch(setFileHandle(fileHandle))
  });

  return connect(
    mapStateToProps,
    mapDispatchToProps
  )(DesktopComponent);
};

export default DesktopHOC;
